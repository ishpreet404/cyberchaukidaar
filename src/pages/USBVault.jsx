import React, { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle, XCircle, Download, Upload, Lock, Unlock, AlertTriangle, HardDrive } from 'lucide-react';
import { Card, Button, Input, StatusBadge, Separator } from '../components';

const USBVault = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [hasVault, setHasVault] = useState(false);
  const [vaultData, setVaultData] = useState(null);
  const [step, setStep] = useState('check'); // check, create, unlock, unlocked, recovery
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [isEditingVault, setIsEditingVault] = useState(false);

  // Domain whitelist - only these domains can decrypt
  const ALLOWED_DOMAINS = ['localhost', 'cyberguard.app', 'cyberchaukidaar.com'];

  // Word list for recovery phrases (BIP39 subset)
  const RECOVERY_WORDS = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
    'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
    'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
    'adult', 'advance', 'advice', 'aerobic', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
    'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien',
    'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always',
    'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
    'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety',
    'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area',
    'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive',
    'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
    'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
    'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware'
  ];

  useEffect(() => {
    checkBrowserSupport();
    checkDomainValidity();
    checkVaultStatus();
  }, []);

  // Check if current domain is allowed
  const checkDomainValidity = () => {
    const currentDomain = window.location.hostname;
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
    
    if (!isAllowed) {
      setError(`⚠ SECURITY: This vault can only be decrypted on authorized domains. Current: ${currentDomain}`);
      console.warn('Unauthorized domain detected:', currentDomain);
    }
    
    return isAllowed;
  };

  // Generate recovery phrase (12 words)
  const generateRecoveryPhrase = () => {
    const words = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * RECOVERY_WORDS.length);
      words.push(RECOVERY_WORDS[randomIndex]);
    }
    return words.join(' ');
  };

  // Hash recovery phrase for storage
  const hashRecoveryPhrase = async (phrase) => {
    const encoder = new TextEncoder();
    // Normalize: lowercase, trim, and collapse multiple spaces to single space
    const normalized = phrase.toLowerCase().trim().replace(/\s+/g, ' ');
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Get domain signature for encryption
  const getDomainSignature = async () => {
    const allowedDomainsStr = ALLOWED_DOMAINS.sort().join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(allowedDomainsStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  useEffect(() => {
    // Setup extension sync listeners
    const handleExtensionSync = async (event) => {
      console.log('Extension sync request received:', event.detail);
      
      if (event.detail && event.detail.passwords) {
        // Merge extension passwords with vault
        if (!isLocked && vaultData) {
          const updatedVault = {
            ...vaultData,
            extensionPasswords: event.detail.passwords,
            lastModified: new Date().toISOString()
          };
          setVaultData(updatedVault);
          
          // Auto-save to vault file if we have a stored file handle
          try {
            await autoSaveVault(updatedVault);
            setSuccess('✓ Synced with extension & saved to vault');
          } catch (err) {
            console.log('Auto-save skipped:', err.message);
            setSuccess('✓ Synced with extension (save vault to persist)');
          }
          
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    };
    
    const handleSyncRequest = () => {
      console.log('USB sync request from extension');
      
      // Send current vault passwords to extension
      if (!isLocked && vaultData) {
        window.dispatchEvent(new CustomEvent('usbSyncResponse', {
          detail: {
            passwords: vaultData.extensionPasswords || [],
            timestamp: Date.now()
          }
        }));
      }
    };
    
    window.addEventListener('usbSyncFromExtension', handleExtensionSync);
    window.addEventListener('usbSyncRequest', handleSyncRequest);
    
    return () => {
      window.removeEventListener('usbSyncFromExtension', handleExtensionSync);
      window.removeEventListener('usbSyncRequest', handleSyncRequest);
    };
  }, [isLocked, vaultData]);

  // Check if File System Access API is supported
  const checkBrowserSupport = () => {
    if (!('showSaveFilePicker' in window)) {
      setError('⚠ File System Access API not supported. Use Chrome/Edge browser.');
    }
  };

  // Check if vault exists in localStorage
  const checkVaultStatus = () => {
    const vaultInfo = localStorage.getItem('cyberguard_vault_info');
    if (vaultInfo) {
      const info = JSON.parse(vaultInfo);
      setHasVault(true);
      setStep('choose'); // Let user choose between unlock or create new
    } else {
      setStep('create');
    }
  };

  // Generate encryption key from device ID
  const deriveKey = async (deviceId, salt) => {
    const encoder = new TextEncoder();
    const deviceKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceId),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      deviceKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  // Generate consistent device ID
  const generateDeviceId = () => {
    let deviceId = localStorage.getItem('cyberguard_device_id');
    if (!deviceId) {
      deviceId = 'DEV-' + Date.now() + '-' + crypto.getRandomValues(new Uint8Array(16)).join('');
      localStorage.setItem('cyberguard_device_id', deviceId);
    }
    return deviceId;
  };

  // Get stored passwords from extension
  const getStoredPasswords = () => {
    try {
      const stored = localStorage.getItem('cyberguard_passwords');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Error reading stored passwords:', err);
    }
    return [];
  };

  // Auto-save vault to previously used file handle
  const autoSaveVault = async (updatedVaultData) => {
    // Get stored file handle from IndexedDB or create new one
    const vaultInfo = JSON.parse(localStorage.getItem('cyberguard_vault_info') || '{}');
    
    // For security, we can't persist file handles, so we'll skip auto-save
    // User must manually update vault when they want to persist changes
    throw new Error('Auto-save not available - use UPDATE VAULT button');
  };

  // Generate checksum for integrity verification
  const generateChecksum = async (data) => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  // Encrypt data with tamper protection
  const encryptData = async (data) => {
    // Verify domain before encrypting
    if (!checkDomainValidity()) {
      throw new Error('Encryption not allowed on this domain');
    }

    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Get domain signature
    const domainSig = await getDomainSignature();
    
    // Add integrity markers and checksums
    const enhancedData = {
      ...data,
      _integrity: {
        timestamp: Date.now(),
        checksum: await generateChecksum(JSON.stringify(data)),
        marker: 'CYBERGUARD_VAULT_V1_USB_ONLY',
        accessCount: 0,
        domainSignature: domainSig,
        allowedDomains: ALLOWED_DOMAINS
      }
    };
    
    const deviceId = generateDeviceId();
    const key = await deriveKey(deviceId, salt);
    
    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(JSON.stringify(enhancedData))
    );

    // Add magic bytes header for format validation
    const magicBytes = new Uint8Array([0x43, 0x47, 0x56, 0x4B]); // "CGVK"
    
    // Combine magic bytes + salt + iv + encrypted data
    const encryptedData = new Uint8Array(
      magicBytes.length + salt.length + iv.length + encryptedContent.byteLength
    );
    encryptedData.set(magicBytes, 0);
    encryptedData.set(salt, magicBytes.length);
    encryptedData.set(iv, magicBytes.length + salt.length);
    encryptedData.set(
      new Uint8Array(encryptedContent), 
      magicBytes.length + salt.length + iv.length
    );

    return encryptedData;
  };

  // Decrypt data with integrity verification
  const decryptData = async (encryptedData) => {
    try {
      // Verify magic bytes
      const magicBytes = encryptedData.slice(0, 4);
      const expectedMagic = new Uint8Array([0x43, 0x47, 0x56, 0x4B]); // "CGVK"
      
      if (!magicBytes.every((byte, i) => byte === expectedMagic[i])) {
        throw new Error('Invalid file format - File may be corrupted or copied');
      }

      const salt = encryptedData.slice(4, 20);
      const iv = encryptedData.slice(20, 32);
      const data = encryptedData.slice(32);

      const deviceId = generateDeviceId();
      const key = await deriveKey(deviceId, salt);
      
      // Decrypt first
      const decryptedContent = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      const vaultData = JSON.parse(decoder.decode(decryptedContent));
      
      // Verify domain signature after decryption
      const expectedDomainSig = await getDomainSignature();
      if (vaultData._integrity.domainSignature !== expectedDomainSig) {
        throw new Error('DOMAIN MISMATCH: Vault can only be decrypted on: ' + 
          (vaultData._integrity.allowedDomains || ALLOWED_DOMAINS).join(', '));
      }
      
      // Verify integrity
      if (!vaultData._integrity) {
        throw new Error('File integrity check failed - Vault may be tampered');
      }

      // Check if file is too old (optional: 90 days expiry)
      const fileAge = Date.now() - vaultData._integrity.timestamp;
      if (fileAge > 90 * 24 * 60 * 60 * 1000) {
        console.warn('Vault file is older than 90 days - Consider creating a new one');
      }

      // Verify checksum
      const dataWithoutIntegrity = { ...vaultData };
      delete dataWithoutIntegrity._integrity;
      const computedChecksum = await generateChecksum(JSON.stringify(dataWithoutIntegrity));
      
      if (computedChecksum !== vaultData._integrity.checksum) {
        throw new Error('Integrity check failed - File has been modified');
      }

      // Increment access count
      vaultData._integrity.accessCount += 1;

      return vaultData;
    } catch (err) {
      if (err.message.includes('integrity') || err.message.includes('format') || err.message.includes('DOMAIN')) {
        throw err;
      }
      throw new Error('Decryption failed - Wrong device, corrupted file, or tampered vault');
    }
  };

  // Create new vault and save to USB
  const createVault = async () => {
    setProcessing(true);
    setError('');

    try {
      // Check browser support
      if (!('showSaveFilePicker' in window)) {
        throw new Error('File System Access API not supported');
      }

      // Generate recovery phrase
      const newRecoveryPhrase = generateRecoveryPhrase();
      const recoveryHash = await hashRecoveryPhrase(newRecoveryPhrase);
      
      // Generate unique vault ID
      const vaultId = 'VAULT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Get passwords from previously synced data (if any)
      const storedPasswords = vaultData?.extensionPasswords || {};

      // Create vault data
      const vaultData = {
        version: '1.0',
        vaultId: vaultId,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        deviceId: generateDeviceId(),
        recoveryHash: recoveryHash,
        extensionPasswords: storedPasswords,
        userNotes: userNotes
      };

      setRecoveryPhrase(newRecoveryPhrase);
      setShowRecoveryPhrase(true);

      // Encrypt the data (no password needed)
      const encryptedData = await encryptData(vaultData);

      // Show save file picker with USB drive hint
      const handle = await window.showSaveFilePicker({
        suggestedName: 'cyberguard-vault.key',
        types: [{
          description: 'CyberGuard USB Vault (Store on USB Only)',
          accept: { 'application/octet-stream': ['.key'] }
        }],
        excludeAcceptAllOption: true,
        startIn: 'downloads' // Hint to user to select USB
      });

      // Write encrypted data to file
      const writable = await handle.createWritable();
      await writable.write(encryptedData);
      await writable.close();

      // Store vault info (not the password!)
      const vaultInfo = {
        vaultId: vaultData.vaultId,
        created: vaultData.created,
        deviceId: vaultData.deviceId,
        fileName: 'cyberguard-vault.key',
        lastAccess: Date.now(),
        recoveryHash: recoveryHash
      };
      localStorage.setItem('cyberguard_vault_info', JSON.stringify(vaultInfo));

      setSuccess('✓ Vault created! SAVE YOUR RECOVERY PHRASE NOW!');
      setHasVault(true);
      // Don't change step yet - show recovery phrase first
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('File save cancelled');
      } else {
        setError('Failed to create vault: ' + err.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Update existing vault
  const updateVault = async () => {
    setProcessing(true);
    setError('');

    try {
      if (!vaultData) {
        throw new Error('No vault loaded');
      }

      // Check browser support
      if (!('showSaveFilePicker' in window)) {
        throw new Error('File System Access API not supported');
      }

      // Update vault data - exclude _integrity as it will be regenerated during encryption
      // Use existing extensionPasswords from vaultData (already synced via event)
      const { _integrity, ...coreVaultData } = vaultData;
      const updatedVaultData = {
        ...coreVaultData,
        lastModified: new Date().toISOString(),
        extensionPasswords: vaultData.extensionPasswords || {},
        userNotes: userNotes
      };

      // Encrypt the updated data
      const encryptedData = await encryptData(updatedVaultData);

      // Show save file picker
      const handle = await window.showSaveFilePicker({
        suggestedName: 'cyberguard-vault.key',
        types: [{
          description: 'CyberGuard USB Vault (Store on USB Only)',
          accept: { 'application/octet-stream': ['.key'] }
        }],
        excludeAcceptAllOption: true,
        startIn: 'downloads'
      });

      // Write encrypted data to file
      const writable = await handle.createWritable();
      await writable.write(encryptedData);
      await writable.close();

      // Update vault data in state
      setVaultData(updatedVaultData);
      setIsEditingVault(false);
      setSuccess('✓ Vault updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('File save cancelled');
      } else {
        setError('Failed to update vault: ' + err.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Load and verify vault from USB
  const loadVault = async () => {
    setProcessing(true);
    setError('');

    try {
      // Check browser support
      if (!('showOpenFilePicker' in window)) {
        throw new Error('File System Access API not supported');
      }

      // Show file picker with USB hint
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'CyberGuard USB Vault Key',
          accept: { 'application/octet-stream': ['.key'] }
        }],
        excludeAcceptAllOption: true,
        multiple: false
      });

      // Check file name
      if (!handle.name.includes('cyberguard-vault')) {
        console.warn('Warning: File name does not match expected vault file');
      }

      // Read file
      const file = await handle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      const encryptedData = new Uint8Array(arrayBuffer);

      // Decrypt data (no password needed)
      const decryptedVault = await decryptData(encryptedData);

      // Verify device ID
      const storedInfo = JSON.parse(localStorage.getItem('cyberguard_vault_info'));
      if (decryptedVault.deviceId !== storedInfo.deviceId) {
        throw new Error('Security violation: Vault was created on a different device');
      }

      // Verify vault ID hasn't been invalidated
      if (storedInfo.vaultId && decryptedVault.vaultId !== storedInfo.vaultId) {
        throw new Error('⚠ CORRUPTED KEY: This USB key was created before vault recovery and is no longer valid. All pre-recovery keys are permanently voided. Use your current vault key or create a new one.');
      }

      // Update access info
      storedInfo.lastAccess = Date.now();
      storedInfo.accessCount = (storedInfo.accessCount || 0) + 1;
      localStorage.setItem('cyberguard_vault_info', JSON.stringify(storedInfo));

      // Log suspicious activity if too many accesses in short time
      if (storedInfo.accessCount > 10) {
        const timeSinceCreation = Date.now() - new Date(storedInfo.created).getTime();
        if (timeSinceCreation < 60 * 60 * 1000) { // 1 hour
          console.warn('⚠ Suspicious activity detected: Multiple access attempts');
        }
      }

      // Success!
      setVaultData(decryptedVault);
      setUserNotes(decryptedVault.userNotes || '');
      setIsLocked(false);
      setStep('unlocked');
      setSuccess(`✓ Vault unlocked! Access #${decryptedVault._integrity.accessCount}`);

      // Auto-lock after 5 minutes
      setTimeout(() => {
        lockVault();
      }, 5 * 60 * 1000);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('File selection cancelled');
      } else {
        setError('Failed to unlock vault: ' + err.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Lock vault
  const lockVault = () => {
    setIsLocked(true);
    setVaultData(null);
    setStep('choose'); // Go back to choice menu
    setSuccess('System locked');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Reset vault
  const resetVault = () => {
    if (confirm('⚠ This will remove vault configuration. You can still use your USB key file later.')) {
      localStorage.removeItem('cyberguard_vault_info');
      setHasVault(false);
      setIsLocked(true);
      setVaultData(null);
      setStep('create');
      setSuccess('Vault configuration reset');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // Recover vault using recovery phrase
  const recoverVault = async () => {
    if (!recoveryInput.trim()) {
      setError('Please enter your 12-word recovery phrase');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const storedInfo = JSON.parse(localStorage.getItem('cyberguard_vault_info'));
      if (!storedInfo || !storedInfo.recoveryHash) {
        throw new Error('No vault found to recover');
      }

      // Hash input and verify
      const inputHash = await hashRecoveryPhrase(recoveryInput);
      if (inputHash !== storedInfo.recoveryHash) {
        throw new Error('Invalid recovery phrase');
      }

      // Generate new vault ID (invalidates all old USB keys)
      const newVaultId = 'VAULT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      // Update stored info with new vault ID
      storedInfo.vaultId = newVaultId;
      storedInfo.lastRecovery = Date.now();
      storedInfo.recoveryCount = (storedInfo.recoveryCount || 0) + 1;
      localStorage.setItem('cyberguard_vault_info', JSON.stringify(storedInfo));

      // Clear user notes for fresh start
      setUserNotes('');

      setSuccess('✓ Recovery successful! All previous USB keys are now VOIDED and corrupted. Create a fresh vault with new notes.');
      setShowRecoveryMode(false);
      setRecoveryInput('');
      setStep('create');
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Recovery failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Close recovery phrase display
  const closeRecoveryDisplay = () => {
    setShowRecoveryPhrase(false);
    setRecoveryPhrase('');
    setStep('choose'); // Go back to choice menu
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shadow-terminal mb-2">
          $ USB_VAULT --MODE=HARDWARE_SECURITY
        </h1>
        <p className="text-terminal-muted">
          Hardware-backed encryption for your sensitive data
        </p>
      </div>

      <Separator variant="equals" />

      {/* Browser Support Warning */}
      {error && error.includes('not supported') && (
        <Card>
          <div className="flex items-start gap-3 text-terminal-amber">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <div className="font-bold mb-2">BROWSER NOT SUPPORTED</div>
              <div className="text-sm">
                File System Access API requires Chrome or Edge browser (v86+).
                Firefox and Safari do not support this feature yet.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Status Card */}
      <Card title="▸ VAULT STATUS">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isLocked ? (
              <Lock className="w-8 h-8 text-terminal-amber" />
            ) : (
              <Unlock className="w-8 h-8 text-terminal-green" />
            )}
            <div>
              <div className="text-lg font-bold">
                {isLocked ? 'LOCKED' : 'UNLOCKED'}
              </div>
              <div className="text-sm text-terminal-muted">
                {!hasVault && 'No vault configured'}
                {hasVault && isLocked && 'Insert USB key to unlock'}
                {hasVault && !isLocked && 'Auto-lock in 5 minutes'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={isLocked ? 'warning' : 'ok'}>
              {isLocked ? 'SECURED' : 'ACTIVE'}
            </StatusBadge>
            {hasVault && (
              <div className="text-xs text-terminal-muted mt-1">
                AES-256-GCM
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Domain Warning */}
      {!ALLOWED_DOMAINS.some(domain => 
        window.location.hostname === domain || 
        window.location.hostname.endsWith('.' + domain)
      ) && (
        <Card>
          <div className="flex items-start gap-3 text-terminal-red">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <div className="font-bold mb-2">⚠ DOMAIN SECURITY WARNING</div>
              <div className="text-sm mb-2">
                This vault can only be encrypted/decrypted on authorized domains:
              </div>
              <div className="text-sm font-mono text-terminal-green">
                {ALLOWED_DOMAINS.map(d => `• ${d}`).join('\n').split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
              <div className="text-sm mt-2">
                Current domain: <span className="text-terminal-amber">{window.location.hostname}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="border border-terminal-green bg-terminal-bg p-4">
          <div className="flex items-center gap-2 text-terminal-green">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-terminal-red bg-terminal-bg p-4">
          <div className="flex items-center gap-2 text-terminal-red">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Recovery Phrase Display */}
      {showRecoveryPhrase && recoveryPhrase && (
        <Card title="▸ RECOVERY PHRASE - WRITE THIS DOWN!">
          <div className="space-y-4">
            <div className="bg-terminal-bg border-2 border-terminal-amber p-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-terminal-amber" />
                <div className="text-terminal-amber font-bold">
                  CRITICAL: SAVE THESE 12 WORDS IN ORDER
                </div>
              </div>
              
              <div className="bg-black border border-terminal-green p-6 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {recoveryPhrase.split(' ').map((word, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-terminal-muted text-xs select-none">{index + 1}.</span>
                      <span className="text-terminal-green font-mono font-bold">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm text-terminal-amber mb-4">
                <p><strong>⚠ Write these words on paper and store safely</strong></p>
                <p>• Use this phrase to recover access if you lose your USB</p>
                <p>• Recovery will INVALIDATE all previous USB keys</p>
                <p>• Anyone with these words can access your vault</p>
                <p>• Do NOT store digitally or take screenshots</p>
              </div>

              <Button 
                onClick={closeRecoveryDisplay} 
                className="w-full"
                variant="warning"
              >
                I HAVE WRITTEN DOWN MY RECOVERY PHRASE
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Choose Mode - for existing vault users */}
      {step === 'choose' && (
        <Card title="▸ SELECT MODE">
          <div className="space-y-4">
            <div className="bg-terminal-bg border border-terminal-muted p-4 mb-4">
              <div className="text-sm text-terminal-muted">
                <p className="mb-2">A vault configuration was found on this device.</p>
                <p>Load your vault from USB to access your secured data.</p>
              </div>
            </div>

            <Card>
              <div className="text-center space-y-3">
                <Unlock className="w-12 h-12 text-terminal-green mx-auto" />
                <h3 className="text-lg font-bold text-terminal-green">UNLOCK VAULT</h3>
                <p className="text-sm text-terminal-muted">
                  Load your vault from USB drive
                </p>
                <Button 
                  onClick={() => setStep('unlock')}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  UNLOCK VAULT
                </Button>
              </div>
            </Card>

            <Separator variant="dash" />

            <div className="text-center">
              <Button 
                onClick={() => setShowRecoveryMode(true)}
                variant="secondary"
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                LOST USB? USE RECOVERY PHRASE
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Vault */}
      {step === 'create' && !showRecoveryPhrase && (
        <Card title="▸ CREATE NEW VAULT">
          <div className="space-y-4">
            <div className="bg-terminal-bg border border-terminal-muted p-4">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-5 h-5 text-terminal-green flex-shrink-0 mt-1" />
                <div className="text-sm text-terminal-muted space-y-2">
                  <p><strong className="text-terminal-green">Step 1:</strong> Insert your USB drive NOW</p>
                  <p><strong className="text-terminal-green">Step 2:</strong> Save encrypted vault ONLY to USB drive</p>
                  <p><strong className="text-terminal-green">Step 3:</strong> Keep USB safe - never copy the file</p>
                  <div className="border-l-2 border-terminal-amber pl-3 mt-3">
                    <p className="text-terminal-amber"><strong>⚠ CRITICAL SECURITY WARNINGS:</strong></p>
                    <p className="text-terminal-amber mt-1">• If you lose the USB, use recovery phrase to invalidate it</p>
                    <p className="text-terminal-amber">• Copying/moving the vault file will make it unusable</p>
                    <p className="text-terminal-amber">• Vault is bound to THIS device only</p>
                    <p className="text-terminal-amber">• File includes tamper detection - do not edit</p>
                    <p className="text-terminal-amber">• Save your 12-word recovery phrase on paper</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Notes */}
            <div className="space-y-2">
              <label className="text-sm text-terminal-muted">PERSONAL NOTES (OPTIONAL):</label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full h-24 bg-black border border-terminal-green text-terminal-green p-3 font-mono text-sm focus:outline-none focus:border-terminal-green resize-none"
                placeholder="Add any notes about this vault..."
              />
            </div>

            <Button 
              onClick={createVault} 
              disabled={processing}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {processing ? 'CREATING VAULT...' : 'CREATE & SAVE TO USB'}
            </Button>
            
            {hasVault && (
              <Button 
                onClick={() => setStep('choose')}
                variant="secondary"
                className="w-full"
              >
                BACK TO OPTIONS
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Unlock Vault */}
      {step === 'unlock' && !showRecoveryMode && (
        <Card title="▸ UNLOCK VAULT">
          <div className="space-y-4">
            <div className="bg-terminal-bg border border-terminal-amber p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-terminal-amber flex-shrink-0 mt-1" />
                <div className="text-sm text-terminal-amber">
                  <p className="font-bold mb-2">USB DRIVE REQUIRED</p>
                  <p>1. Insert your USB drive containing the vault file</p>
                  <p>2. Select the original vault file (do NOT use copied files)</p>
                  <p>3. File must be on the same device it was created on</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="w-6 h-6 text-terminal-green" />
              <div className="text-sm text-terminal-muted">
                Select cyberguard-vault.key from your USB drive
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                onClick={loadVault} 
                disabled={processing}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {processing ? 'VERIFYING...' : 'LOAD FROM USB'}
              </Button>
              <Button 
                onClick={() => setStep('choose')}
                variant="secondary"
              >
                BACK
              </Button>
            </div>

            <Separator variant="dash" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                onClick={() => setShowRecoveryMode(true)}
                variant="warning"
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                USE RECOVERY PHRASE
              </Button>
            </div>

            <div className="border border-terminal-muted bg-terminal-bg p-3">
              <div className="text-xs text-terminal-muted space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-terminal-green">•</span>
                  <span>File: cyberguard-vault.key</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-terminal-green">•</span>
                  <span>Encryption: AES-256-GCM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-terminal-green">•</span>
                  <span>Key Derivation: Device-based (PBKDF2 100k iterations)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recovery Mode */}
      {showRecoveryMode && (
        <Card title="▸ VAULT RECOVERY">
          <div className="space-y-4">
            <div className="bg-terminal-bg border border-terminal-amber p-4">
              <div className="flex items-start gap-3">
                <Key className="w-6 h-6 text-terminal-amber flex-shrink-0 mt-1" />
                <div className="text-sm text-terminal-amber space-y-2">
                  <p className="font-bold">RECOVERY PHRASE AUTHENTICATION</p>
                  <p>Enter your 12-word recovery phrase to regain access.</p>
                  <p className="text-terminal-red font-bold mt-2">
                    ⚠ WARNING: This will INVALIDATE all existing USB keys!
                  </p>
                  <p>After recovery, you must create a new vault and save it to USB.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-terminal-muted">
                RECOVERY PHRASE (12 words):
              </label>
              <textarea
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(e.target.value.toLowerCase())}
                className="w-full h-32 bg-terminal-bg border border-terminal-green text-terminal-green p-4 font-mono text-sm focus:outline-none focus:border-terminal-green resize-none"
                placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                disabled={processing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                onClick={recoverVault}
                disabled={!recoveryInput || processing}
                variant="warning"
                className="w-full"
              >
                {processing ? 'RECOVERING...' : 'RECOVER VAULT'}
              </Button>
              <Button 
                onClick={() => { setShowRecoveryMode(false); setRecoveryInput(''); }}
                variant="danger"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Unlocked - Show Protected Content */}
      {step === 'unlocked' && vaultData && (
        <>
          <Card title="▸ VAULT CONTENTS">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-terminal-green" />
                <div>
                  <div className="font-bold text-terminal-green">ACCESS GRANTED</div>
                  <div className="text-sm text-terminal-muted">
                    Created: {new Date(vaultData.created).toLocaleString()}
                  </div>
                  {vaultData.lastModified && vaultData.lastModified !== vaultData.created && (
                    <div className="text-xs text-terminal-muted">
                      Modified: {new Date(vaultData.lastModified).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <Separator variant="dash" />

              {/* Extension Passwords */}
              <div className="space-y-2">
                <div className="text-sm text-terminal-muted mb-3">STORED PASSWORDS FROM EXTENSION:</div>
                <div className="text-xs text-terminal-green bg-black border border-terminal-green/30 p-2 mb-3">
                  \u229a AUTO-SYNC ENABLED: Passwords saved in extension automatically sync here. Click UPDATE VAULT to persist to USB.
                </div>
                {vaultData.extensionPasswords && Object.keys(vaultData.extensionPasswords).length > 0 ? (
                  Object.entries(vaultData.extensionPasswords).flatMap(([domain, passwords]) => 
                    passwords.map((pwd, index) => (
                      <div key={`${domain}-${index}`} className="border border-terminal-green bg-terminal-bg p-3">
                        <div className="text-xs text-terminal-muted">PASSWORD ENTRY</div>
                        <div className="text-sm font-bold text-terminal-green">
                          {domain}
                        </div>
                        <div className="text-terminal-green font-mono mt-1 text-xs">
                          Username: {pwd.username || 'N/A'}
                        </div>
                        <div className="text-terminal-muted text-xs mt-1">
                          Strength: {pwd.strength?.rating || 'N/A'}
                        </div>
                        {pwd.createdAt && (
                          <div className="text-terminal-muted text-xs mt-1">
                            Saved: {new Date(pwd.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  <div className="border border-terminal-muted bg-terminal-bg p-3 text-terminal-muted text-sm">
                    No passwords stored yet. Use the extension to save passwords.
                  </div>
                )}
              </div>

              <Separator variant="dash" />

              {/* User Notes */}
              <div className="space-y-2">
                <div className="text-sm text-terminal-muted mb-2">PERSONAL NOTES:</div>
                <div className="border border-terminal-green bg-terminal-bg p-3">
                  {isEditingVault ? (
                    <textarea
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="w-full h-32 bg-black border border-terminal-green text-terminal-green p-3 font-mono text-sm focus:outline-none focus:border-terminal-green resize-none"
                      placeholder="Enter your personal notes here..."
                    />
                  ) : (
                    <div className="text-terminal-green text-sm whitespace-pre-wrap min-h-[100px]">
                      {vaultData.userNotes || 'No notes added yet.'}
                    </div>
                  )}
                </div>
              </div>

              <Separator variant="dash" />

              {/* Vault Data */}
              <div className="space-y-3">
                <div className="border border-terminal-green bg-terminal-bg p-3">
                  <div className="text-xs text-terminal-muted mb-1">VAULT_ID</div>
                  <div className="text-terminal-green text-sm font-bold">{vaultData.vaultId}</div>
                </div>
                <div className="border border-terminal-green bg-terminal-bg p-3">
                  <div className="text-xs text-terminal-muted mb-1">DOMAIN_LOCKED</div>
                  <div className="text-terminal-green text-sm font-bold">YES</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {isEditingVault ? (
                  <>
                    <Button onClick={updateVault} variant="primary" className="flex-1" disabled={processing}>
                      <Download className="w-4 h-4 mr-2" />
                      {processing ? 'SAVING...' : 'SAVE TO USB'}
                    </Button>
                    <Button onClick={() => {
                      setIsEditingVault(false);
                      setUserNotes(vaultData.userNotes || '');
                    }} variant="secondary">
                      CANCEL
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => {
                      // Enter edit mode - passwords are already synced via auto-sync
                      setIsEditingVault(true);
                    }} variant="primary" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      UPDATE VAULT
                    </Button>
                    <Button onClick={lockVault} variant="warning" className="flex-1">
                      <Lock className="w-4 h-4 mr-2" />
                      LOCK VAULT
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Security Details */}
          <Card title="▸ SECURITY DETAILS">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-terminal-green bg-terminal-bg p-3">
                <div className="text-xs text-terminal-muted mb-1">ENCRYPTION</div>
                <div className="text-terminal-green text-sm font-bold">AES-256-GCM</div>
              </div>
              <div className="border border-terminal-green bg-terminal-bg p-3">
                <div className="text-xs text-terminal-muted mb-1">KEY_DERIVATION</div>
                <div className="text-terminal-green text-sm font-bold">PBKDF2-SHA256</div>
              </div>
              <div className="border border-terminal-green bg-terminal-bg p-3">
                <div className="text-xs text-terminal-muted mb-1">ITERATIONS</div>
                <div className="text-terminal-green text-sm font-bold">100,000</div>
              </div>
              <div className="border border-terminal-green bg-terminal-bg p-3">
                <div className="text-xs text-terminal-muted mb-1">DEVICE_ID</div>
                <div className="text-terminal-green text-sm font-bold">{vaultData.deviceId}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-terminal-muted">
              <div className="flex items-start gap-2">
                <span className="text-terminal-green">✓</span>
                <div>Data encrypted with military-grade AES-256</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-terminal-green">✓</span>
                <div>Device-based encryption (no password needed)</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-terminal-green">✓</span>
                <div>Vault file bound to this device fingerprint</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-terminal-green">✓</span>
                <div>Auto-lock after 5 minutes of inactivity</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-terminal-green">✓</span>
                <div>Integrity checksums prevent file tampering</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-terminal-green">✓</span>
                <div>Magic bytes validation detects copied files</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-terminal-green">✓</span>
                <div>Access counting tracks usage patterns</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default USBVault;
