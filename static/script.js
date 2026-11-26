class VoiceChat {
    constructor() {
        this.socket = null;
        this.isRecording = false;
        this.isPlaying = false;
        this.recognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.fullResponse = '';
        
        // DOM Elements
        this.micButton = document.getElementById('micButton');
        this.playButton = document.getElementById('playButton');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.transcriptDisplay = document.getElementById('transcript');
        this.messagesContainer = document.getElementById('messages');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.wsStatus = document.getElementById('wsStatus');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.visualizerBars = document.querySelectorAll('.voice-visualizer .bar');
        
        // Initialize
        this.initSpeechRecognition();
        this.initWebSocket();
        this.bindEvents();
        this.updateVisualizer(0);
    }
    
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.updateVoiceStatus('listening');
            this.isRecording = true;
            this.updateMicButton();
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            this.transcriptDisplay.textContent = finalTranscript || interimTranscript;
            
            // Visualizer animation based on speech
            this.updateVisualizer(interimTranscript.length * 2);
            
            // If we have final transcript, send it to server
            if (finalTranscript) {
                this.sendMessage(finalTranscript);
                this.addMessage(finalTranscript, 'user');
                this.transcriptDisplay.textContent = '';
                
                // Stop recognition temporarily
                this.recognition.stop();
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateVoiceStatus('error');
            this.isRecording = false;
            this.updateMicButton();
        };
        
        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            this.updateVoiceStatus('ready');
            this.isRecording = false;
            this.updateMicButton();
            this.updateVisualizer(0);
        };
    }
    
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const wsHost = isLocal ? 'localhost:8000' : window.location.host;
        const wsUrl = `${protocol}://${wsHost}/ws/chat`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.wsStatus.textContent = 'Connected';
            this.wsStatus.className = 'connected';
            this.statusIndicator.className = 'status-indicator connected';
            this.statusText.textContent = 'Connected to AI Assistant';
        };
        
        this.socket.onmessage = (event) => {
            const message = event.data;
            
            if (message === '[END]') {
                // End of message, speak the full response
                this.speakResponse(this.fullResponse);
                this.playButton.disabled = false;
                this.fullResponse = '';
            } else {
                // Accumulate response
                this.fullResponse += message;
                
                // Update the latest AI message or create new one
                this.updateOrCreateAIMessage(this.fullResponse);
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.wsStatus.textContent = 'Error';
            this.statusIndicator.className = 'status-indicator';
            this.statusText.textContent = 'Connection error';
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.wsStatus.textContent = 'Disconnected';
            this.wsStatus.className = '';
            this.statusIndicator.className = 'status-indicator';
            this.statusText.textContent = 'Disconnected from server';
            
            // Try to reconnect after 3 seconds
            setTimeout(() => this.initWebSocket(), 3000);
        };
    }
    
    bindEvents() {
        // Microphone button
        this.micButton.addEventListener('click', () => this.toggleRecording());
        
        // Play button
        this.playButton.addEventListener('click', () => this.playLastResponse());
        
        // Volume slider
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            if (this.currentUtterance) {
                this.currentUtterance.volume = volume;
            }
        });
    }
    
    toggleRecording() {
        if (!this.recognition) {
            alert('Speech recognition not initialized');
            return;
        }
        
        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }
    
    updateMicButton() {
        const icon = this.micButton.querySelector('i');
        const text = this.micButton.querySelector('span');
        
        if (this.isRecording) {
            this.micButton.classList.add('recording');
            icon.className = 'fas fa-stop-circle';
            text.textContent = 'Stop Recording';
        } else {
            this.micButton.classList.remove('recording');
            icon.className = 'fas fa-microphone';
            text.textContent = 'Start Speaking';
        }
    }
    
    updateVoiceStatus(status) {
        this.voiceStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        this.voiceStatus.className = status;
    }
    
    updateVisualizer(level) {
        const baseHeight = 10;
        const maxHeight = 40;
        
        this.visualizerBars.forEach((bar, index) => {
            const randomFactor = 0.7 + Math.random() * 0.6;
            let height = baseHeight + (level * randomFactor);
            height = Math.min(height, maxHeight);
            height = this.isRecording ? height : baseHeight;
            
            // Different animation for each bar
            const delay = index * 0.1;
            bar.style.height = `${height}px`;
            bar.style.transition = `height ${0.1 + delay}s ease`;
            bar.style.background = this.isRecording ? 
                `hsl(${220 + level * 2}, 70%, 60%)` : '#4f46e5';
        });
    }
    
    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            this.statusText.textContent = 'Sending to AI...';
        } else {
            alert('Not connected to server. Please try again.');
        }
    }
    
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const header = document.createElement('div');
        header.className = 'message-header';
        
        if (sender === 'user') {
            header.innerHTML = '<i class="fas fa-user"></i> You';
        } else {
            header.innerHTML = '<i class="fas fa-robot"></i> AI Assistant';
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.textContent = content;
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    updateOrCreateAIMessage(content) {
        let aiMessage = this.messagesContainer.querySelector('.ai-message:last-child');
        
        if (!aiMessage || !aiMessage.classList.contains('streaming')) {
            aiMessage = this.addMessage(content, 'ai');
            aiMessage.classList.add('streaming');
        } else {
            const contentDiv = aiMessage.querySelector('div:last-child');
            contentDiv.textContent = content;
        }
        
        this.statusText.textContent = 'AI is responding...';
        this.scrollToBottom();
    }
    
    speakResponse(text) {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.volume = parseFloat(this.volumeSlider.value);
        this.currentUtterance.rate = 1.0;
        this.currentUtterance.pitch = 1.0;
        
        this.currentUtterance.onstart = () => {
            this.isPlaying = true;
            this.playButton.innerHTML = '<i class="fas fa-pause"></i><span>Pause Speech</span>';
            this.statusText.textContent = 'AI is speaking...';
        };
        
        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play Response</span>';
            this.statusText.textContent = 'Ready for next message';
            
            // Remove streaming class from AI message
            const aiMessage = this.messagesContainer.querySelector('.ai-message.streaming');
            if (aiMessage) {
                aiMessage.classList.remove('streaming');
            }
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isPlaying = false;
            this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Play Response</span>';
        };
        
        this.speechSynthesis.speak(this.currentUtterance);
    }
    
    playLastResponse() {
        const aiMessages = this.messagesContainer.querySelectorAll('.ai-message');
        if (aiMessages.length === 0) return;
        
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        const text = lastAiMessage.querySelector('div:last-child').textContent;
        
        if (this.speechSynthesis.speaking) {
            if (this.speechSynthesis.paused) {
                this.speechSynthesis.resume();
                this.playButton.innerHTML = '<i class="fas fa-pause"></i><span>Pause Speech</span>';
            } else {
                this.speechSynthesis.pause();
                this.playButton.innerHTML = '<i class="fas fa-play"></i><span>Resume Speech</span>';
            }
        } else {
            this.speakResponse(text);
        }
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const voiceChat = new VoiceChat();
    
    // Add welcome message
    setTimeout(() => {
        const welcomeDiv = voiceChat.addMessage(
            "Hello! I'm your AI assistant. Click the microphone button and start speaking to begin our conversation.",
            'ai'
        );
        welcomeDiv.classList.remove('streaming');
    }, 500);
    
    // Keyboard shortcut for microphone (Space key)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            voiceChat.toggleRecording();
        }
    });
    
    // Check browser compatibility
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('This browser does not support the Web Speech API. Please use Chrome, Edge, or Safari.');
    }
});