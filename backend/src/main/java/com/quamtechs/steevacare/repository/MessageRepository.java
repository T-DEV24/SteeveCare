// src/main/java/com/quamtechs/steevacare/repository/MessageRepository.java
package com.quamtechs.steevacare.repository;

import com.quamtechs.steevacare.entity.Appointment;
import com.quamtechs.steevacare.entity.Message;
import com.quamtechs.steevacare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m " +
           "WHERE (m.sender = :user1 AND m.receiver = :user2) " +
           "   OR (m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("user1") User user1, @Param("user2") User user2);

    List<Message> findByAppointmentOrderByTimestampAsc(Appointment appointment);

    long countByReceiverAndIsReadFalse(User receiver);

    @Query("SELECT m FROM Message m WHERE m.receiver = :receiver AND m.isRead = false")
    List<Message> findUnreadByReceiver(@Param("receiver") User receiver);
}
