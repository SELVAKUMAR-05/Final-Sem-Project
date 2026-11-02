package com.securedms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

@Service
public class EncryptionService {

    @Value("${security.encryption.key:ncrb-aes256-evidence-enc-key-32b!}")
    private String rawEncryptionKey;

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final int TAG_LENGTH_BYTES = TAG_LENGTH_BITS / 8;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SecretKeySpec getKeySpec() throws Exception {
        byte[] key = MessageDigest.getInstance("SHA-256")
                .digest(rawEncryptionKey.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(key, "AES");
    }

    public byte[] encryptFile(byte[] fileData) throws Exception {
        if (fileData == null) {
            throw new IllegalArgumentException("File data must not be null");
        }

        byte[] iv = new byte[IV_LENGTH_BYTES];
        SECURE_RANDOM.nextBytes(iv);
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, getKeySpec(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
        byte[] encrypted = cipher.doFinal(fileData);

        // Store the nonce with the authenticated ciphertext for decryption.
        byte[] combined = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
        return combined;
    }

    public byte[] decryptFile(byte[] encryptedDataWithIv) throws Exception {
        if (encryptedDataWithIv == null
                || encryptedDataWithIv.length < IV_LENGTH_BYTES + TAG_LENGTH_BYTES) {
            throw new IllegalArgumentException("Encrypted data is too short");
        }

        byte[] iv = new byte[IV_LENGTH_BYTES];
        System.arraycopy(encryptedDataWithIv, 0, iv, 0, IV_LENGTH_BYTES);
        byte[] cipherText = new byte[encryptedDataWithIv.length - IV_LENGTH_BYTES];
        System.arraycopy(encryptedDataWithIv, IV_LENGTH_BYTES, cipherText, 0, cipherText.length);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, getKeySpec(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
        return cipher.doFinal(cipherText);
    }
}
