package com.securedms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Service
public class EncryptionService {

    @Value("${security.encryption.key:ncrb-aes256-evidence-enc-key-32b!}")
    private String rawEncryptionKey;

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";

    private SecretKeySpec getKeySpec() throws Exception {
        byte[] key = rawEncryptionKey.getBytes("UTF-8");
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        key = sha.digest(key);
        key = Arrays.copyOf(key, 32); // 256 bit key
        return new SecretKeySpec(key, "AES");
    }

    public byte[] encryptFile(byte[] fileData) throws Exception {
        byte[] iv = new byte[16];
        new SecureRandom().nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, getKeySpec(), ivSpec);
        byte[] encrypted = cipher.doFinal(fileData);

        // Prepend IV to ciphertext for recovery
        byte[] combined = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
        return combined;
    }

    public byte[] decryptFile(byte[] encryptedDataWithIv) throws Exception {
        byte[] iv = new byte[16];
        System.arraycopy(encryptedDataWithIv, 0, iv, 0, 16);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        byte[] cipherText = new byte[encryptedDataWithIv.length - 16];
        System.arraycopy(encryptedDataWithIv, 16, cipherText, 0, cipherText.length);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, getKeySpec(), ivSpec);
        return cipher.doFinal(cipherText);
    }
}
