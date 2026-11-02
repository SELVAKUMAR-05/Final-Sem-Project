package com.securedms.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.AEADBadTagException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EncryptionServiceTest {

    private EncryptionService encryptionService;

    @BeforeEach
    void setUp() {
        encryptionService = new EncryptionService();
        ReflectionTestUtils.setField(encryptionService, "rawEncryptionKey", "test-encryption-key");
    }

    @Test
    void encryptAndDecryptRoundTrip() throws Exception {
        byte[] fileData = "confidential document".getBytes(StandardCharsets.UTF_8);

        byte[] encryptedData = encryptionService.encryptFile(fileData);

        assertArrayEquals(fileData, encryptionService.decryptFile(encryptedData));
    }

    @Test
    void encryptionUsesDifferentNonces() throws Exception {
        byte[] fileData = "same document".getBytes(StandardCharsets.UTF_8);

        byte[] first = encryptionService.encryptFile(fileData);
        byte[] second = encryptionService.encryptFile(fileData);

        assertFalse(Arrays.equals(first, second));
    }

    @Test
    void rejectsTamperedCiphertext() throws Exception {
        byte[] encryptedData = encryptionService.encryptFile("document".getBytes(StandardCharsets.UTF_8));
        encryptedData[encryptedData.length - 1] ^= 1;

        assertThrows(AEADBadTagException.class, () -> encryptionService.decryptFile(encryptedData));
    }

    @Test
    void rejectsDataTooShortToContainNonceAndTag() {
        assertThrows(IllegalArgumentException.class, () -> encryptionService.decryptFile(new byte[27]));
    }
}
