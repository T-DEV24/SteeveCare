// src/main/java/com/quamtechs/steevacare/repository/UserRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.enums.AccountStatus;
import com.quamtechs.steevacare.enums.Role;
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

    List<User> findAllByStatusNot(AccountStatus status);

    List<User> findByRole(Role role);

    List<User> findByRoleAndStatusNot(Role role, AccountStatus status);

    long countByRole(Role role);

    long countByStatus(AccountStatus status);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.status != :excludeStatus")
    long countByRoleAndStatusNot(@Param("role") Role role, @Param("excludeStatus") AccountStatus excludeStatus);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status = :status AND u.role != :excludeRole")
    long countByStatusAndRoleNot(@Param("status") AccountStatus status, @Param("excludeRole") Role excludeRole);
}
