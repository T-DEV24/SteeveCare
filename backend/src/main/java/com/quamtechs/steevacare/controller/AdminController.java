// src/main/java/com/quamtechs/steevacare/controller/AdminController.java
package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.CreateUserRequest;
import com.quamtechs.steevacare.dto.response.AdminStatsResponse;
import com.quamtechs.steevacare.dto.response.UserResponse;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','GESTIONNAIRE','SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    /**
     * POST /api/admin/users — Créer un compte utilisateur
     */
    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(
        @Valid @RequestBody CreateUserRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminService.createUser(request, currentUser.getId()));
    }

    /**
     * GET /api/admin/users — Lister tous les utilisateurs (hors DELETED)
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    /**
     * PATCH /api/admin/users/{id}/freeze — Geler un compte
     */
    @PatchMapping("/users/{id}/freeze")
    public ResponseEntity<UserResponse> freezeAccount(
        @PathVariable Long id,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminService.freezeAccount(id, currentUser.getId()));
    }

    /**
     * PATCH /api/admin/users/{id}/unfreeze — Dégeler un compte
     */
    @PatchMapping("/users/{id}/unfreeze")
    public ResponseEntity<UserResponse> unfreezeAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unfreezeAccount(id));
    }

    /**
     * DELETE /api/admin/delete/{id} — Suppression définitive (SUPER_ADMIN uniquement)
     */
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/admin/stats — Statistiques du tableau de bord
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    /**
     * GET /api/admin/users/{id} — Détail d'un utilisateur
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(
        @PathVariable Long id,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }
}
