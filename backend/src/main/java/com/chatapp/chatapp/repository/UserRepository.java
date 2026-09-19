package com.chatapp.chatapp.repository;

import com.chatapp.chatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE (LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND u.id <> :excludeUserId")
    List<User> searchUsers(@Param("query") String query, @Param("excludeUserId") Long excludeUserId);

    @Query("SELECT u FROM User u WHERE u.id <> :excludeUserId ORDER BY u.name ASC")
    List<User> findAllExcept(@Param("excludeUserId") Long excludeUserId);
}
