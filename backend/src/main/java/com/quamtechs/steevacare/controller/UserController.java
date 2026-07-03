package com.quamtechs.steevacare.controller;

import com.quamtechs.steevacare.dto.request.ChangePasswordRequest;
import com.quamtechs.steevacare.dto.request.UpdateUserPreferencesRequest;
import com.quamtechs.steevacare.dto.request.UpdateUserProfileRequest;
import com.quamtechs.steevacare.dto.response.UserPreferencesResponse;
import com.quamtechs.steevacare.dto.response.UserProfileResponse;
import com.quamtechs.steevacare.entity.User;
import com.quamtechs.steevacare.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * GET /api/users/me — Profil commun de l'utilisateur authentifié, tous rôles confondus.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getMyProfile(currentUser.getId()));
    }

    /**
     * PUT /api/users/profile — Mise à jour des informations personnelles communes.
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
        @AuthenticationPrincipal User currentUser,
        @Valid @RequestBody UpdateUserProfileRequest request
    ) {
        return ResponseEntity.ok(userService.updateProfile(currentUser.getId(), request));
    }

    /**
     * POST /api/users/password — Changement de mot de passe après validation de l'ancien mot de passe.
     */
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
        @AuthenticationPrincipal User currentUser,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/users/avatar — Upload temporaire sur disque local dans uploads/avatars.
     */
    @PostMapping("/avatar")
    public ResponseEntity<UserProfileResponse> updateAvatar(
        @AuthenticationPrincipal User currentUser,
        @RequestParam("avatar") MultipartFile avatar
    ) {
        return ResponseEntity.ok(userService.updateAvatar(currentUser.getId(), avatar));
    }

    /**
     * PUT /api/users/preferences — Préférences persistées sur le compte utilisateur.
     */
    @PutMapping("/preferences")
    public ResponseEntity<UserPreferencesResponse> updatePreferences(
        @AuthenticationPrincipal User currentUser,
        @Valid @RequestBody UpdateUserPreferencesRequest request
    ) {
        return ResponseEntity.ok(userService.updatePreferences(currentUser.getId(), request));
    }

    /**
     * PATCH /api/users/me/deactivate — Désactivation volontaire : le compte est gelé et ne peut plus se connecter.
     */
    @PatchMapping("/me/deactivate")
    public ResponseEntity<Void> deactivateMe(@AuthenticationPrincipal User currentUser) {
        userService.deactivateMyAccount(currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
