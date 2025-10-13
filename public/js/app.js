/**
 * Vitea test suite - MedAI scribe - Frontend Application
 * JavaScript functionality for the medical AI scribe interface
 */

class ViteaApp {
  constructor() {
    this.apiBaseUrl = '/api/transcript';
    this.processingStartTime = null;
    this.currentResults = null;
    
    this.initializeElements();
    this.attachEventListeners();
    this.checkApiHealth();
  }

  initializeElements() {
    // Input elements
    this.transcriptInput = document.getElementById('transcriptInput');
    this.processBtn = document.getElementById('processBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.mockModeCheckbox = document.getElementById('mockMode');

    // Audio elements
    this.audioInput = document.getElementById('audioInput');
    this.audioUploadArea = document.getElementById('audioUploadArea');
    this.uploadPrompt = document.getElementById('uploadPrompt');
    this.audioPreview = document.getElementById('audioPreview');
    this.audioPlayer = document.getElementById('audioPlayer');
    this.audioFilename = document.getElementById('audioFilename');
    this.audioSize = document.getElementById('audioSize');
    this.transcribeBtn = document.getElementById('transcribeBtn');
    this.processAudioBtn = document.getElementById('processAudioBtn');
    this.clearAudioBtn = document.getElementById('clearAudioBtn');
    this.mockModeAudioCheckbox = document.getElementById('mockModeAudio');
    this.transcribedText = document.getElementById('transcribedText');
    this.transcriptionResult = document.getElementById('transcriptionResult');
    this.loadingMessage = document.getElementById('loadingMessage');

    // Tab elements
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Section elements
    this.loadingSection = document.getElementById('loadingSection');
    this.resultsSection = document.getElementById('resultsSection');
    this.errorSection = document.getElementById('errorSection');

    // Results elements
    this.dataPointsCount = document.getElementById('dataPointsCount');
    this.processingTime = document.getElementById('processingTime');
    this.validationStatus = document.getElementById('validationStatus');
    this.categoriesResults = document.getElementById('categoriesResults');

    // Action elements
    this.exportBtn = document.getElementById('exportBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.retryBtn = document.getElementById('retryBtn');
    this.errorMessage = document.getElementById('errorMessage');

    // Recording elements
    this.startRecordBtn = document.getElementById('startRecordBtn');
    this.stopRecordBtn = document.getElementById('stopRecordBtn');
    this.pauseRecordBtn = document.getElementById('pauseRecordBtn');
    this.recordingStatus = document.getElementById('recordingStatus');
    this.recordingTime = document.getElementById('recordingTime');
    this.audioVisualizer = document.getElementById('audioVisualizer');
    this.recordedAudio = document.getElementById('recordedAudio');
    this.recordedPlayer = document.getElementById('recordedPlayer');
    this.recordingDuration = document.getElementById('recordingDuration');
    this.recordingTranscript = document.getElementById('recordingTranscript');
    this.liveTranscriptText = document.getElementById('liveTranscriptText');
    this.transcribeRecordBtn = document.getElementById('transcribeRecordBtn');
    this.processRecordBtn = document.getElementById('processRecordBtn');
    this.clearRecordBtn = document.getElementById('clearRecordBtn');
    this.mockModeRecordCheckbox = document.getElementById('mockModeRecord');
    this.recordingArea = document.getElementById('recordingArea');

    // Audio file state
    this.selectedAudioFile = null;
    this.transcriptionData = null;
    
    // Recording state
    this.mediaRecorder = null;
    this.audioStream = null;
    this.recordedBlobs = [];
    this.isRecording = false;
    this.isPaused = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;
  }

  attachEventListeners() {
    // Text input events
    this.processBtn.addEventListener('click', () => this.processTranscript());
    this.clearBtn.addEventListener('click', () => this.clearInput());
    
    // Audio events
    this.audioUploadArea.addEventListener('click', () => this.audioInput.click());
    this.audioInput.addEventListener('change', (e) => this.handleAudioSelection(e));
    this.transcribeBtn.addEventListener('click', () => this.transcribeAudio());
    this.processAudioBtn.addEventListener('click', () => this.processTranscribedAudio());
    this.clearAudioBtn.addEventListener('click', () => this.clearAudioInput());
    
    // Recording events
    this.startRecordBtn.addEventListener('click', () => this.startRecording());
    this.stopRecordBtn.addEventListener('click', () => this.stopRecording());
    this.pauseRecordBtn.addEventListener('click', () => this.pauseRecording());
    this.transcribeRecordBtn.addEventListener('click', () => this.transcribeRecording());
    this.processRecordBtn.addEventListener('click', () => this.processRecordedTranscript());
    this.clearRecordBtn.addEventListener('click', () => this.clearRecording());
    
    // Drag and drop for audio
    this.audioUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.audioUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.audioUploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    
    // Tab navigation
    this.tabButtons.forEach(button => {
      button.addEventListener('click', (e) => this.switchTab(e));
    });
    
    // Results actions
    this.exportBtn.addEventListener('click', () => this.exportResults());
    this.copyBtn.addEventListener('click', () => this.copyToClipboard());
    this.retryBtn.addEventListener('click', () => this.hideError());

    // Auto-resize textarea
    this.transcriptInput.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = (e.target.scrollHeight) + 'px';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.processTranscript();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.clearInput();
      }
    });
  }

  async checkApiHealth() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      const data = await response.json();
      console.log('API Health:', data);
    } catch (error) {
      console.warn('API health check failed:', error);
    }
  }

  async processTranscript() {
    const transcript = this.transcriptInput.value.trim();

    if (!transcript) {
      this.showError('Please enter a medical transcript to process.');
      return;
    }

    this.showLoading();
    this.processingStartTime = Date.now();

    try {
      const options = {
        mockResponse: this.mockModeCheckbox.checked
      };

      const response = await fetch(`${this.apiBaseUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          options
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      this.currentResults = data;
      this.showResults(data);

    } catch (error) {
      console.error('Processing error:', error);
      this.showError(error.message || 'Failed to process transcript. Please try again.');
    }
  }

  showLoading(message = 'Processing medical transcript...') {
    this.hideAllSections();
    this.loadingMessage.textContent = message;
    this.loadingSection.style.display = 'block';
    this.processBtn.disabled = true;
    this.processAudioBtn.disabled = true;
  }

  showResults(data) {
    this.hideAllSections();

    // Update summary
    const processingTime = Date.now() - this.processingStartTime;
    this.dataPointsCount.textContent = data.data.summary.totalDataPoints || 0;
    this.processingTime.textContent = `${processingTime}ms`;
    this.validationStatus.textContent = data.validation.isValid ? 'Valid' : 'Issues Found';
    this.validationStatus.style.color = data.validation.isValid ? 'var(--secondary-color)' : 'var(--warning-color)';

    // Render results
    this.renderResults(data.data.categories, this.categoriesResults);

    // Show validation warnings if any
    if (data.validation.warnings && data.validation.warnings.length > 0) {
      this.showValidationWarnings(data.validation.warnings);
    }

    this.resultsSection.style.display = 'block';
    this.processBtn.disabled = false;

    // Scroll to results
    this.resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  renderResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML = '<div class="no-results">No data points found</div>';
      return;
    }

    container.innerHTML = results.map(item => `
      <div class="result-item">
        <div class="result-category">${item.category}</div>
        <div class="result-details">
          ${item.details && item.details.length > 0
            ? `<ul>${item.details.map(detail => `<li>${this.escapeHtml(detail)}</li>`).join('')}</ul>`
            : '<p>No additional details provided</p>'
          }
        </div>
      </div>
    `).join('');
  }

  showValidationWarnings(warnings) {
    const warningHtml = `
      <div class="validation-warnings" style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 1rem; margin: 1rem 0; border-radius: var(--border-radius);">
        <strong>⚠️ Validation Warnings:</strong>
        <ul style="margin: 0.5rem 0 0 1.5rem;">
          ${warnings.map(warning => `<li>${this.escapeHtml(warning)}</li>`).join('')}
        </ul>
      </div>
    `;
    
    this.resultsSection.insertAdjacentHTML('afterbegin', warningHtml);
  }

  showError(message) {
    this.hideAllSections();
    this.errorMessage.textContent = message;
    this.errorSection.style.display = 'block';
    this.processBtn.disabled = false;
  }

  hideError() {
    this.errorSection.style.display = 'none';
  }

  hideAllSections() {
    this.loadingSection.style.display = 'none';
    this.resultsSection.style.display = 'none';
    this.errorSection.style.display = 'none';
  }

  clearInput() {
    this.transcriptInput.value = '';
    this.transcriptInput.style.height = 'auto';
    this.hideAllSections();
    this.transcriptInput.focus();
  }

  async exportResults() {
    if (!this.currentResults) {
      this.showError('No results to export');
      return;
    }

    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        extractedData: this.currentResults.data,
        validation: this.currentResults.validation,
        metadata: this.currentResults.metadata
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `vitea-extraction-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showSuccessMessage('Results exported successfully!');

    } catch (error) {
      this.showError('Failed to export results: ' + error.message);
    }
  }

  async copyToClipboard() {
    if (!this.currentResults) {
      this.showError('No results to copy');
      return;
    }

    try {
      const formattedResults = this.formatResultsForClipboard(this.currentResults.data);
      await navigator.clipboard.writeText(formattedResults);
      this.showSuccessMessage('Results copied to clipboard!');
    } catch (error) {
      this.showError('Failed to copy to clipboard: ' + error.message);
    }
  }

  formatResultsForClipboard(data) {
    let output = '=== CLINICAL DATA EXTRACTION ===\\n\\n';

    // All categories
    if (data.categories && data.categories.length > 0) {
      data.categories.forEach((item, index) => {
        output += `${index + 1}. ${item.category}:\\n`;
        if (item.details && item.details.length > 0) {
          item.details.forEach(detail => {
            output += `   - ${detail}\\n`;
          });
        }
        output += '\\n';
      });
    }

    output += '=== END OF EXTRACTION ===';
    return output;
  }

  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--secondary-color);
      color: white;
      padding: 1rem 2rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      z-index: 1000;
      animation: fadeIn 0.3s ease-in;
    `;
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Tab switching functionality
  switchTab(e) {
    const targetTab = e.currentTarget.dataset.tab;
    
    // Update active tab button
    this.tabButtons.forEach(btn => {
      btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Update active tab content
    this.tabContents.forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });
    
    const targetContent = document.getElementById(`${targetTab}Tab`);
    if (targetContent) {
      targetContent.classList.add('active');
      targetContent.style.display = 'block';
    }
  }

  // Audio handling methods
  handleAudioSelection(e) {
    const file = e.target.files[0];
    if (file) {
      this.displayAudioFile(file);
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    this.audioUploadArea.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.audioUploadArea.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    this.audioUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        this.displayAudioFile(file);
        // Set the file to the input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        this.audioInput.files = dataTransfer.files;
      } else {
        this.showError('Please drop an audio file');
      }
    }
  }

  displayAudioFile(file) {
    this.selectedAudioFile = file;
    
    // Show preview
    this.uploadPrompt.style.display = 'none';
    this.audioPreview.style.display = 'block';
    
    // Display file info
    this.audioFilename.textContent = file.name;
    this.audioSize.textContent = this.formatFileSize(file.size);
    
    // Set audio source
    const url = URL.createObjectURL(file);
    this.audioPlayer.src = url;
    
    // Enable transcribe button
    this.transcribeBtn.disabled = false;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async transcribeAudio() {
    if (!this.selectedAudioFile) {
      this.showError('Please select an audio file first');
      return;
    }

    this.showLoading('Transcribing audio...');
    this.transcribeBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('audio', this.selectedAudioFile);
      formData.append('mockTranscription', this.mockModeAudioCheckbox.checked);

      const response = await fetch(`${this.apiBaseUrl}/transcribe`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      // Display transcription
      this.transcriptionData = data;
      this.transcribedText.value = data.transcript;
      this.transcriptionResult.style.display = 'block';
      this.processAudioBtn.disabled = false;
      
      this.hideLoading();
      this.showSuccessMessage('Audio transcribed successfully!');

    } catch (error) {
      console.error('Transcription error:', error);
      this.hideLoading();
      this.showError(error.message || 'Failed to transcribe audio. Please try again.');
      this.transcribeBtn.disabled = false;
    }
  }

  async processTranscribedAudio() {
    if (!this.transcribedText.value) {
      this.showError('No transcription available. Please transcribe audio first.');
      return;
    }

    // Process the transcribed text like regular text
    const transcript = this.transcribedText.value;
    this.showLoading('Extracting clinical data...');
    this.processingStartTime = Date.now();

    try {
      const options = {
        mockResponse: this.mockModeAudioCheckbox.checked
      };

      const response = await fetch(`${this.apiBaseUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          options
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      this.currentResults = data;
      this.showResults(data);

    } catch (error) {
      console.error('Processing error:', error);
      this.showError(error.message || 'Failed to process transcript. Please try again.');
    }
  }

  clearAudioInput() {
    this.selectedAudioFile = null;
    this.transcriptionData = null;
    this.audioInput.value = '';
    this.audioPlayer.src = '';
    this.transcribedText.value = '';
    
    // Reset UI
    this.uploadPrompt.style.display = 'block';
    this.audioPreview.style.display = 'none';
    this.transcriptionResult.style.display = 'none';
    this.transcribeBtn.disabled = true;
    this.processAudioBtn.disabled = true;
    
    this.hideAllSections();
  }

  showLoading(message = 'Processing medical transcript...') {
    this.hideAllSections();
    this.loadingMessage.textContent = message;
    this.loadingSection.style.display = 'block';
    this.processBtn.disabled = true;
    this.processAudioBtn.disabled = true;
  }

  hideLoading() {
    this.loadingSection.style.display = 'none';
    this.processBtn.disabled = false;
    if (this.transcriptionData) {
      this.processAudioBtn.disabled = false;
    }
  }

  // Recording functionality
  async startRecording() {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.recordedBlobs = [];
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedBlobs.push(event.data);
        }
      });

      this.mediaRecorder.addEventListener('stop', () => {
        this.handleRecordingComplete();
      });

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      // Update UI
      this.updateRecordingUI();
      this.startRecordingTimer();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      this.showError('Microphone access denied or not available. Please enable microphone permissions.');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.audioStream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
      this.isPaused = false;
      this.clearRecordingTimer();
      this.updateRecordingUI();
    }
  }

  pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      if (this.isPaused) {
        this.mediaRecorder.resume();
        this.isPaused = false;
        this.pauseRecordBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.startRecordingTimer();
      } else {
        this.mediaRecorder.pause();
        this.isPaused = true;
        this.pauseRecordBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        this.clearRecordingTimer();
      }
    }
  }

  handleRecordingComplete() {
    const blob = new Blob(this.recordedBlobs, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(blob);
    
    // Show recorded audio player
    this.recordedPlayer.src = audioUrl;
    this.recordedAudio.style.display = 'block';
    
    // Calculate duration
    const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
    this.recordingDuration.textContent = `Duration: ${this.formatTime(duration)}`;
    
    // Enable transcription button
    this.transcribeRecordBtn.disabled = false;
    
    // Store the recorded blob for transcription
    this.recordedBlob = blob;
  }

  startRecordingTimer() {
    this.recordingTimer = setInterval(() => {
      if (this.isRecording && !this.isPaused) {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        this.recordingTime.textContent = this.formatTime(elapsed);
      }
    }, 1000);
  }

  clearRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  updateRecordingUI() {
    if (this.isRecording) {
      this.startRecordBtn.disabled = true;
      this.stopRecordBtn.disabled = false;
      this.pauseRecordBtn.disabled = false;
      this.recordingStatus.style.display = 'block';
      this.recordingArea.classList.add('recording');
    } else {
      this.startRecordBtn.disabled = false;
      this.stopRecordBtn.disabled = true;
      this.pauseRecordBtn.disabled = true;
      this.recordingStatus.style.display = 'none';
      this.recordingArea.classList.remove('recording');
      this.recordingTime.textContent = '00:00';
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async transcribeRecording() {
    if (!this.recordedBlob) {
      this.showError('No recording available to transcribe.');
      return;
    }

    this.showLoading('Transcribing audio recording...');
    this.transcribeRecordBtn.disabled = true;

    try {
      // Convert blob to file for API
      const audioFile = new File([this.recordedBlob], 'recording.webm', { 
        type: 'audio/webm' 
      });

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('mockTranscription', this.mockModeRecordCheckbox.checked);

      const response = await fetch(`${this.apiBaseUrl}/transcribe`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      // Display transcription
      this.liveTranscriptText.value = data.transcript || data.transcription || '';
      this.recordingTranscript.style.display = 'block';
      this.processRecordBtn.disabled = false;
      
      // Store transcription data
      this.recordingTranscriptionData = data;

      this.hideLoading();
      this.transcribeRecordBtn.disabled = false;

    } catch (error) {
      console.error('Transcription error:', error);
      
      // If the API fails, fall back to mock mode for demo purposes
      if (this.mockModeRecordCheckbox.checked) {
        const mockTranscript = "Doctor: Good morning, how are you feeling today?\nPatient: I've been having persistent headaches for the past week, especially in the mornings.\nDoctor: Can you describe the pain? Is it sharp, dull, or throbbing?\nPatient: It's more of a throbbing sensation, mainly on the left side of my head.\nDoctor: Any nausea or sensitivity to light?\nPatient: Yes, bright lights make it worse, and I feel nauseous sometimes.\nDoctor: Have you been under any stress lately or changed your sleep pattern?\nPatient: I've been working long hours and only getting about 4-5 hours of sleep.\nDoctor: Based on your symptoms, this could be tension headaches or possibly migraines. I recommend improving your sleep schedule and we'll monitor your symptoms.";
        
        this.liveTranscriptText.value = mockTranscript;
        this.recordingTranscript.style.display = 'block';
        this.processRecordBtn.disabled = false;
        this.hideLoading();
        this.transcribeRecordBtn.disabled = false;
      } else {
        this.showError(error.message || 'Failed to transcribe audio');
        this.hideLoading();
        this.transcribeRecordBtn.disabled = false;
      }
    }
  }

  async processRecordedTranscript() {
    const transcript = this.liveTranscriptText.value.trim();
    if (!transcript) {
      this.showError('No transcript available to process.');
      return;
    }

    this.showLoading('Processing medical transcript...');
    this.processingStartTime = Date.now();

    try {
      const options = {
        mockResponse: this.mockModeRecordCheckbox.checked
      };

      const response = await fetch(`${this.apiBaseUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          options
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      this.currentResults = data;
      this.showResults(data);

    } catch (error) {
      console.error('Processing error:', error);
      this.showError(error.message || 'Failed to process transcript');
    } finally {
      this.hideLoading();
    }
  }

  clearRecording() {
    // Stop any ongoing recording
    this.stopRecording();
    
    // Clear recorded data
    this.recordedBlobs = [];
    this.recordedBlob = null;
    
    // Reset UI
    this.recordedAudio.style.display = 'none';
    this.recordingTranscript.style.display = 'none';
    this.recordedPlayer.src = '';
    this.liveTranscriptText.value = '';
    this.recordingDuration.textContent = '';
    this.transcribeRecordBtn.disabled = true;
    this.processRecordBtn.disabled = true;
    
    this.hideAllSections();
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ViteaApp();
});

// Add fade out animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
  
  .no-results {
    padding: 2rem;
    text-align: center;
    color: #666;
    font-style: italic;
  }
`;
document.head.appendChild(style);