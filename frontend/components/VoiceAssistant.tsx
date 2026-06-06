"use client";

import { useEffect, useState, useRef } from "react";

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState("en-US");
  const [name, setName] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load profile language preference on mount and auth changes
  const loadProfileInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setName("");
      setLang("en-US");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.full_name || data.email.split("@")[0] || "");
        
        // Map language
        const langMap: Record<string, string> = {
          "English": "en-US",
          "Hindi": "hi-IN",
          "Marathi": "mr-IN",
          "Tamil": "ta-IN",
          "Telugu": "te-IN"
        };
        setLang(langMap[data.preferred_language] || "en-US");
      }
    } catch {
      // Fail silent
    }
  };

  useEffect(() => {
    loadProfileInfo();
    window.addEventListener("auth-change", loadProfileInfo);
    return () => window.removeEventListener("auth-change", loadProfileInfo);
  }, []);

  // Text-To-Speech TTS helper
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel any ongoing speaking
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = () => {
          setIsListening(false);
          speakText("Sorry, I could not hear you clearly. Please try again.");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  };

  useEffect(() => {
    initSpeechRecognition();
  }, [lang]);

  // Start dictation (Real-time Web Speech & Audio recording fallback)
  const startListening = async () => {
    setTranscript("");
    setIsListening(true);
    speakText("Listening, please speak now.");

    // 1. Web Speech ASR (if supported)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }

    // 2. MediaRecorder Audio capture (for fallback and uploading)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          
          // If browser didn't support SpeechRecognition, we upload audio file to backend ASR fallback
          if (!recognitionRef.current && audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const audioFile = new File([audioBlob], "voice.webm", { type: "audio/webm" });
            
            const formData = new FormData();
            formData.append("file", audioFile);
            
            // Extract language ISO code
            const langCode = lang.split("-")[0];
            
            try {
              const res = await fetch(`http://127.0.0.1:8000/voice/transcribe?lang=${langCode}`, {
                method: "POST",
                body: formData
              });
              if (res.ok) {
                const data = await res.json();
                setTranscript(data.text);
                speakText("Voice processing complete.");
              }
            } catch (err) {
              console.error("Backend transcription failed:", err);
            }
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      } catch (err) {
        console.error("Audio recording permission denied:", err);
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);
    
    // Stop Speech Recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop Audio Recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    speakText("Thank you. You can now use this dictation to autofill the form.");
  };

  const handleAutofill = () => {
    if (!transcript) return;
    
    // Dispatch custom event to autofill submit form page
    const event = new CustomEvent("autofill-grievance", {
      detail: {
        title: transcript.split(" ").slice(0, 5).join(" ") + "...",
        description: transcript
      }
    });
    window.dispatchEvent(event);
    speakText("Form auto-filled. Please review and submit your grievance.");
    setIsOpen(false);
  };

  const toggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      speakText(name ? `Hello ${name}, how can I help you today?` : "Hello, how can I help you today?");
    } else {
      stopListening();
    }
  };

  return (
    <>
      {/* Floating Microphone Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleOpen}
          className={`relative text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition hover:scale-110 cursor-pointer ${
            isOpen ? "bg-red-500 shadow-red-500/20" : "bg-accent-primary shadow-accent-primary/20"
          }`}
          title="AI Voice Assistant"
        >
          {isOpen ? (
            <span className="text-xl">✕</span>
          ) : (
            <span className="text-xl">🎙️</span>
          )}
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-accent-primary/40 animate-ping -z-10"></span>
          )}
        </button>
      </div>

      {/* Voice Assistant Overlay Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[340px] bg-bg-secondary border border-border-custom rounded-2xl shadow-2xl p-6 z-50 animate-slideUp backdrop-blur-md text-text-primary">
          <div className="flex justify-between items-center border-b border-border-custom pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-bold text-sm text-text-primary">Naarad AI Assistant</h3>
                <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Online</span>
              </div>
            </div>
            <span className="text-xs text-text-secondary font-mono bg-bg-primary px-2 py-0.5 rounded border border-border-custom">
              {lang.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-xs text-text-secondary leading-relaxed">
              {name ? `Welcome, ${name}.` : "Hello!"} I can transcribe your voice in your preferred language and auto-fill grievance submissions.
            </p>

            {/* Pulsing Recording button */}
            <div className="flex justify-center py-2">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition duration-300 shadow-lg cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse shadow-red-500/30"
                    : "bg-bg-input text-accent-primary hover:text-white hover:bg-accent-primary border border-border-custom"
                }`}
              >
                {isListening ? "⏹️" : "🎙️"}
              </button>
            </div>

            <p className="text-xs font-bold text-accent-primary">
              {isListening ? "Listening... Speak clearly now" : "Click mic to speak"}
            </p>

            {/* Live Transcript Display Box */}
            <div className="bg-bg-primary border border-border-custom rounded-xl p-4 min-h-[90px] max-h-[120px] overflow-y-auto text-left text-xs text-text-secondary leading-relaxed">
              {transcript ? (
                <span className="text-text-primary font-medium animate-fadeIn">{transcript}</span>
              ) : (
                <span className="italic text-text-secondary/40">Dictated text will appear here...</span>
              )}
            </div>

            {/* Action Buttons */}
            {transcript && (
              <div className="flex gap-2.5 pt-2 animate-fadeIn">
                <button
                  type="button"
                  onClick={handleAutofill}
                  className="flex-1 bg-accent-primary hover:bg-accent-hover text-white py-2 rounded-lg font-bold text-xs cursor-pointer shadow transition"
                >
                  📝 Autofill Form
                </button>
                <button
                  type="button"
                  onClick={() => setTranscript("")}
                  className="bg-bg-input hover:bg-bg-secondary text-text-secondary py-2 px-3 rounded-lg font-semibold text-xs border border-border-custom cursor-pointer transition"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="text-[10px] text-text-secondary/50 pt-2 border-t border-border-custom/40">
              Naarad-GRS Multilingual Voice Gateway v1.0
            </div>
          </div>
        </div>
      )}
    </>
  );
}
