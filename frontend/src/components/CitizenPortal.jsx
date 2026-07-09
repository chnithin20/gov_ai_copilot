import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { conversationTrees } from '../utils/data';
import { playSound } from '../utils/soundEngine';
import DocumentPreviewModal from './DocumentPreviewModal';

const STEP_LABELS = [
  { title: 'Intent Classifying', desc: 'Recognizing user intent and service category' },
  { title: 'RAG Document Retrieval', desc: 'Fetching guidelines from official manual index' },
  { title: 'Form Synthesis', desc: 'Compiling OCR attachments and filling fields' },
  { title: 'Administrative Routing', desc: 'Forwarding packet to officer inbox for signature' },
  { title: 'Cryptographic Logging', desc: 'Hashing audit trails into the admin ledger' },
];

export default function CitizenPortal({ soundEnabled, onAddApplication, onAddLedgerEntry, currentUser, applications = [] }) {
  const { i18n, t } = useTranslation();
  const myApps = useMemo(() => {
    if (!currentUser) return [];
    return applications.filter(a => a.name.toLowerCase() === currentUser.name.toLowerCase());
  }, [applications, currentUser]);

  const stateKey = `gov_portal_${currentUser?.username || 'guest'}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [{ id: 'welcome', sender: 'copilot', text: t('portal.welcomeMsg', 'Welcome to the Government AI Copilot Service Portal. How can I help you today?') }];
  });

  const [activeFlow, setActiveFlow] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_activeFlow');
      if (saved && saved !== 'null') return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('language') || i18n.language || 'en');
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  
  const [flowStep, setFlowStep] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_flowStep');
      if (saved !== null) return parseInt(saved, 10);
    } catch (e) {}
    return 0;
  });

  const [isTyping, setIsTyping] = useState(false);
  
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_activeTab');
      if (saved && ['upload', 'form', 'status', 'track'].includes(saved)) return saved;
    } catch (e) {}
    return 'upload';
  });

  const [uploadedFiles, setUploadedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_uploadedFiles');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [formFilled, setFormFilled] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_formFilled');
      return saved === 'true';
    } catch (e) {}
    return false;
  });

  const [stepperStates, setStepperStates] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_stepperStates');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [0, 0, 0, 0, 0];
  });

  const [stepperDescs, setStepperDescs] = useState(() => {
    try {
      const saved = localStorage.getItem(stateKey + '_stepperDescs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return STEP_LABELS.map(s => s.desc);
  });

  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    localStorage.setItem(stateKey + '_messages', JSON.stringify(messages));
  }, [messages, stateKey]);

  useEffect(() => {
    localStorage.setItem(stateKey + '_activeFlow', JSON.stringify(activeFlow));
  }, [activeFlow, stateKey]);

  useEffect(() => {
    localStorage.setItem(stateKey + '_flowStep', flowStep.toString());
  }, [flowStep, stateKey]);

  useEffect(() => {
    localStorage.setItem(stateKey + '_activeTab', activeTab);
  }, [activeTab, stateKey]);

  useEffect(() => {
    localStorage.setItem(stateKey + '_uploadedFiles', JSON.stringify(uploadedFiles));
  }, [uploadedFiles, stateKey]);

  useEffect(() => {
    localStorage.setItem(stateKey + '_formFilled', formFilled.toString());
  }, [formFilled, stateKey]);

  useEffect(() => {
    localStorage.setItem(stateKey + '_stepperStates', JSON.stringify(stepperStates));
  }, [stepperStates, stateKey]);

  useEffect(() => {
    localStorage.setItem(stateKey + '_stepperDescs', JSON.stringify(stepperDescs));
  }, [stepperDescs, stateKey]);

  useEffect(() => {
    const handleLangChange = (lng) => {
      setSelectedLanguage(lng);
      localStorage.setItem('language', lng);
    };
    i18n.on('languageChanged', handleLangChange);
    return () => i18n.off('languageChanged', handleLangChange);
  }, [i18n]);

  useEffect(() => {
    const currentLang = selectedLanguage || i18n.language || localStorage.getItem('language') || 'en';
    
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.sender !== 'copilot') return m;
        if (m.id === 'welcome' || m.text.includes('Welcome to the Government') || m.text.includes('सरकारी एआई')) {
          return { ...m, id: 'welcome', text: t('portal.welcomeMsg', 'Welcome to the Government AI Copilot Service Portal. How can I help you today?') };
        }
        if (m.id === 'configuring' || m.text.includes('Configuring workspace') || m.text.includes('चयनित सेवा') || m.text.includes('பணியிட') || m.text.includes('ಕಾರ್ಯಸ್ಥಳ') || m.text.includes('કાર્યસ્થળ') || m.text.includes('कार्यस्थान') || m.text.includes('వర్క్‌స్పేస్') || m.text.includes('വർക്ക്സ്പേസ്')) {
          return { ...m, id: 'configuring', text: t('portal.configuringMsg', 'Configuring workspace for selected service...') };
        }
        if (m.id === 'offline' || m.text.includes('I can assist you with certificate applications')) {
          return { ...m, id: 'offline', text: t('portal.offlineMsg', 'I can assist you with certificate applications (Birth, Death, Caste, Income), Aadhaar Updates, PAN Applications, Agri-Subsidies, Rythu Bandhu Scheme, or Driving License Renewals. Please click a quick service chip above to launch.') };
        }
        if (m.id === 'routed' || m.text.includes('Your application has been routed')) {
          return { ...m, id: 'routed', text: t('portal.routedMsg', 'Your application has been routed. You can check the dashboard or request another service.') };
        }
        if (m.id === 'pleaseWait' || m.text.includes('Please wait for the current action')) {
          return { ...m, id: 'pleaseWait', text: t('portal.pleaseWait', '⚠️ Please wait for the current action to complete before starting a new request.') };
        }
        if (m.id === 'selectWorkflow' || m.text.includes('Please select a service workflow template first')) {
          return { ...m, id: 'selectWorkflow', text: t('portal.selectWorkflowMsg', 'Please select a service workflow template first.') };
        }
        return m;
      });

      if (currentLang !== 'en' && !currentLang.startsWith('en')) {
        updated.forEach(async (m) => {
          if (m.sender === 'copilot' && !['welcome', 'configuring', 'offline', 'routed', 'pleaseWait', 'selectWorkflow'].includes(m.id)) {
            if (m._translatedLang === currentLang) return;
            try {
              const res = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: `Translate the following official government workflow response directly into the target language with code '${currentLang}'. Output ONLY the translated text without quotes or explanation: "${m.text}"`,
                  language: currentLang,
                  session_id: 'translator-system'
                })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.response) {
                  setMessages(currentMsgs => currentMsgs.map(msg => (msg.id === m.id || (msg.text === m.text && !msg._translatedLang)) ? { ...msg, text: data.response, _translatedLang: currentLang } : msg));
                }
              }
            } catch (e) {
              console.warn('Background message translation update failed:', e);
            }
          }
        });
      }
      return updated;
    });
  }, [selectedLanguage, i18n.language, t]);

  // Load TTS voices into browser memory on mount
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speakText = useCallback((text, langCode, force = false) => {
    try {
      if ((!voiceResponseEnabled && !force) || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[\u1000-\uFFFF]|[*#📚🎯_`~]/g, '').trim();
      if (!cleanText) return;

      // Wrap in short timeout to avoid Windows Chrome/Edge TTS cancel freeze bug
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          const langMap = {
            'en': 'en-IN', 'hi': 'hi-IN', 'pb': 'pa-IN', 'pa': 'pa-IN',
            'ta': 'ta-IN', 'te': 'te-IN', 'bn': 'bn-IN', 'mr': 'mr-IN',
            'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN', 'ur': 'ur-IN', 'or': 'or-IN'
          };
          const targetLang = langMap[langCode || selectedLanguage] || langMap[i18n.language] || 'en-IN';
          utterance.lang = targetLang;
          utterance.rate = 1.0;

          // Attach best matching voice if available in the browser
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const matchingVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase()) ||
                                  voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.split('-')[0].toLowerCase())) ||
                                  voices.find(v => v.lang.toLowerCase().includes('india') || v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en-us')) ||
                                  voices.find(v => v.default) || voices[0];
            if (matchingVoice) {
              utterance.voice = matchingVoice;
            }
          }

          utterance.onerror = (e) => console.warn('Speech synthesis error:', e);
          
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Speech execution error:', err);
        }
      }, 50);
    } catch (err) {
      console.warn('Speech synthesis exception:', err);
    }
  }, [voiceResponseEnabled, selectedLanguage, i18n.language]);

  const recognitionRef = useRef(null);

  const handleMicClick = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
        return;
      }

      if (isRecording) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }
        setIsRecording(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      const langMap = {
        'en': 'en-IN', 'hi': 'hi-IN', 'pb': 'pa-IN', 'pa': 'pa-IN',
        'ta': 'ta-IN', 'te': 'te-IN', 'bn': 'bn-IN', 'mr': 'mr-IN',
        'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN', 'ur': 'ur-IN', 'or': 'or-IN'
      };
      recognition.lang = langMap[selectedLanguage] || langMap[i18n.language] || 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        if (soundEnabled) playSound('click');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        if (soundEnabled) playSound('success');
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecording(false);
      alert('Microphone access error. Please check your browser permissions.');
    }
  };
  const chatRef = useRef(null);
  const flowRunning = useRef(false);
  const fileInputRef = useRef(null);
  const dragZoneRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const addMsg = useCallback((sender, text, id = null) => {
    setMessages(prev => [...prev, { id: id || `msg-${Date.now()}-${Math.random()}`, sender, text }]);
    if (sender === 'copilot') {
      speakText(text, selectedLanguage);
    }
  }, [speakText, selectedLanguage]);

  const addTranslatedCopilotMsg = useCallback(async (text, id = null) => {
    const currentLang = selectedLanguage || i18n.language || localStorage.getItem('language') || 'en';
    if (currentLang === 'en' || currentLang.startsWith('en')) {
      addMsg('copilot', text, id);
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Translate the following official government workflow response directly into the target language with code '${currentLang}'. Output ONLY the translated text without quotes or explanation: "${text}"`,
          language: currentLang,
          session_id: 'translator-system'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          addMsg('copilot', data.response, id);
          return;
        }
      }
    } catch (e) {
      console.warn('Realtime translation fallback:', e);
    }
    addMsg('copilot', text, id);
  }, [selectedLanguage, i18n.language, addMsg]);

  const setStep = useCallback((idx, state, desc) => {
    setStepperStates(prev => { const n = [...prev]; n[idx] = state; return n; });
    if (desc) setStepperDescs(prev => { const n = [...prev]; n[idx] = desc; return n; });
  }, []);

  const resetStepper = useCallback(() => {
    setStepperStates([0, 0, 0, 0, 0]);
    setStepperDescs(STEP_LABELS.map(s => s.desc));
  }, []);

  const handleResetChat = useCallback(() => {
    if (window.confirm(t('portal.confirmReset', 'Are you sure you want to clear your conversation history and reset the current workflow?'))) {
      const welcomeMsg = [{ id: 'welcome', sender: 'copilot', text: t('portal.welcomeMsg', 'Welcome to the Government AI Copilot Service Portal. How can I help you today?') }];
      setMessages(welcomeMsg);
      setActiveFlow(null);
      setFlowStep(0);
      setFormFilled(false);
      setUploadedFiles([]);
      setStepperStates([0, 0, 0, 0, 0]);
      setStepperDescs(STEP_LABELS.map(s => s.desc));
      localStorage.removeItem(stateKey + '_messages');
      localStorage.removeItem(stateKey + '_activeFlow');
      localStorage.removeItem(stateKey + '_flowStep');
      localStorage.removeItem(stateKey + '_uploadedFiles');
      localStorage.removeItem(stateKey + '_formFilled');
      localStorage.removeItem(stateKey + '_stepperStates');
      localStorage.removeItem(stateKey + '_stepperDescs');
      if (soundEnabled) playSound('swoosh');
    }
  }, [t, stateKey, soundEnabled]);

  const startFlow = useCallback((key) => {
    if (flowRunning.current || isTyping) {
      addMsg('copilot', t('portal.pleaseWait', '⚠️ Please wait for the current action to complete before starting a new request.'), 'pleaseWait');
      if (soundEnabled) playSound('error');
      return;
    }
    if (activeFlow === key && flowStep > 0) return;
    if (activeFlow && activeFlow !== key && flowStep > 0 && flowStep < 4) {
      const confirmSwitch = window.confirm(t('portal.confirmSwitch', 'You have an in-progress application. Are you sure you want to start a different service? Your current workflow progress will be replaced.'));
      if (!confirmSwitch) return;
    }
    flowRunning.current = true;
    const tree = conversationTrees[key];
    if (!tree) return;

    setActiveFlow(key);
    setFlowStep(0);
    setFormFilled(false);
    setUploadedFiles([]);
    resetStepper();
    const configMsg = t('portal.configuringMsg', 'Configuring workspace for selected service...');
    setMessages([{ id: 'configuring', sender: 'copilot', text: configMsg }]);
    speakText(configMsg, selectedLanguage);

    setIsTyping(true);
    const sessionId = currentUser ? `session-${currentUser.username}` : 'session-anonymous';
    const queryText = `I want to apply for service: ${tree.formTitle}. Please explain the eligibility, required documents, and steps.`;

    fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: queryText,
        language: selectedLanguage,
        session_id: sessionId
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
    .then(data => {
      setIsTyping(false);
      const step = tree.steps[0];
      if (data.response) {
        addMsg('copilot', data.response);
      } else {
        addTranslatedCopilotMsg(step.copilot);
      }
      setStep(step.stepper, 1, step.stepDetail);
      onAddLedgerEntry({ txId: tree.txId, event: `Intent Classified: ${key.toUpperCase()}`, dept: tree.dept });
      if (soundEnabled) playSound('click');
      if (data.sources && data.sources.length > 0) {
        addTranslatedCopilotMsg(`📚 Sources referenced:\n` + data.sources.map(src => `- ${src}`).join('\n'));
      }
      if (data.confidence !== undefined) {
        addTranslatedCopilotMsg(`🎯 Confidence score: ${(data.confidence * 100).toFixed(0)}%`);
      }
      setFlowStep(1);
      flowRunning.current = false;
    })
    .catch(err => {
      console.warn('Real API backend chat failed (running in offline mode):', err);
      setIsTyping(false);
      const step = tree.steps[0];
      addTranslatedCopilotMsg(step.copilot);
      setStep(step.stepper, 1, step.stepDetail);
      onAddLedgerEntry({ txId: tree.txId, event: `Intent Classified: ${key.toUpperCase()}`, dept: tree.dept });
      if (soundEnabled) playSound('click');
      setFlowStep(1);
      flowRunning.current = false;
    });
  }, [soundEnabled, addMsg, addTranslatedCopilotMsg, setStep, resetStepper, onAddLedgerEntry, selectedLanguage, currentUser, t, speakText]);

  const advanceFlow = useCallback(() => {
    if (!activeFlow || flowRunning.current) return;
    const tree = conversationTrees[activeFlow];
    if (!tree || flowStep >= tree.steps.length) {
      addMsg('copilot', t('portal.routedMsg', 'Your application has been routed. You can check the dashboard or request another service.'), 'routed');
      setActiveFlow(null);
      flowRunning.current = false;
      return;
    }

    flowRunning.current = true;
    const prevStep = tree.steps[flowStep - 1];
    if (prevStep) setStep(prevStep.stepper, 2);

    const currentStep = tree.steps[flowStep];
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      addTranslatedCopilotMsg(currentStep.copilot);
      setStep(currentStep.stepper, 1, currentStep.stepDetail);
      onAddLedgerEntry({ txId: tree.txId, event: `Step ${flowStep + 1}: ${currentStep.stepDetail.substring(0, 40)}...`, dept: tree.dept });
      if (soundEnabled) playSound('click');
      if (flowStep + 1 >= tree.steps.length) {
        setTimeout(() => setStep(currentStep.stepper, 2), 500);
        if (soundEnabled) playSound('success');
        flowRunning.current = false;
        setActiveFlow(null);
      } else {
        setFlowStep(prev => prev + 1);
        flowRunning.current = false;
      }
    }, 1200);
  }, [activeFlow, flowStep, soundEnabled, addMsg, addTranslatedCopilotMsg, setStep, onAddLedgerEntry, t]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    addMsg('citizen', text);
    if (soundEnabled) playSound('click');

    setIsTyping(true);
    const sessionId = currentUser ? `session-${currentUser.username}` : 'session-anonymous';
    
    // ALWAYS fetch response from the backend API, whether in activeFlow or general chat
    fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        language: selectedLanguage,
        session_id: sessionId
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
    .then(data => {
      setIsTyping(false);
      addMsg('copilot', data.response);
      if (soundEnabled) playSound('success');
      
      if (data.sources && data.sources.length > 0) {
        const citationMsg = `📚 Sources referenced:\n` + data.sources.map(src => `- ${src}`).join('\n');
        addTranslatedCopilotMsg(citationMsg);
      }
      if (data.confidence !== undefined) {
        addTranslatedCopilotMsg(`🎯 Confidence score: ${(data.confidence * 100).toFixed(0)}%`);
      }

      // If in active workflow, advance visual stepper on right side while showing real AI answer
      if (activeFlow) {
        const tree = conversationTrees[activeFlow];
        if (tree && flowStep < tree.steps.length) {
          const currentStep = tree.steps[flowStep];
          setStep(currentStep.stepper, 1, currentStep.stepDetail);
          onAddLedgerEntry({ txId: tree.txId, event: `Step ${flowStep + 1}: ${text.substring(0, 30)}...`, dept: tree.dept });
          if (flowStep + 1 >= tree.steps.length) {
            setTimeout(() => setStep(currentStep.stepper, 2), 500);
            setActiveFlow(null);
          } else {
            setFlowStep(prev => prev + 1);
          }
        }
      }
    })
    .catch(err => {
      console.warn('Real API backend chat failed (running in offline mode):', err);
      setIsTyping(false);
      if (activeFlow) {
        advanceFlow();
      } else {
        addMsg('copilot', t('portal.offlineMsg', 'I can assist you with certificate applications (Birth, Death, Caste, Income), Aadhaar Updates, PAN Applications, Agri-Subsidies, Rythu Bandhu Scheme, or Driving License Renewals. Please click a quick service chip above to launch.'), 'offline');
        if (soundEnabled) playSound('error');
      }
    });
  };

  // File upload simulation and backend integration
  const handleFileUpload = useCallback((file) => {
    if (!activeFlow) {
      addMsg('copilot', t('portal.selectWorkflowMsg', 'Please select a service workflow template first.'), 'selectWorkflow');
      if (soundEnabled) playSound('error');
      return;
    }

    const allowedExtensions = /\.(pdf|txt|md|json|csv|jpg|jpeg|png|webp)$/i;
    if (!allowedExtensions.test(file.name)) {
      addMsg('copilot', `⚠️ File format not supported (${file.name}). Please upload PDF, TXT, MD, CSV, or Image files.`);
      if (soundEnabled) playSound('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addMsg('copilot', `⚠️ File size exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller document.`);
      if (soundEnabled) playSound('error');
      return;
    }

    setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, status: 'scanning' }]);
    if (soundEnabled) playSound('click');

    // Real API background upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', conversationTrees[activeFlow]?.dept || 'General');
    formData.append('document_type', 'Policy');

    fetch('http://localhost:8000/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => {
      if (!res.ok) throw new Error('Upload error');
      return res.json();
    })
    .then(data => {
      console.log('Real backend upload success:', data);
      // Fetch confirmation response from backend chat API
      const sessionId = currentUser ? `session-${currentUser.username}` : 'session-anonymous';
      fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I have uploaded document: ${file.name} (${data.status}). Please confirm verification and next steps.`,
          language: selectedLanguage,
          session_id: sessionId
        })
      })
      .then(r => r.json())
      .then(chatData => {
        if (chatData.response) {
          addMsg('copilot', chatData.response);
        }
      })
      .catch(e => console.warn('Backend chat confirmation fallback:', e));
    })
    .catch(err => {
      console.warn('Real backend upload failed (running in offline mode):', err);
    });

    setTimeout(() => {
      setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'verified' } : f));
      if (soundEnabled) playSound('success');

      const tree = conversationTrees[activeFlow];
      if (!tree) return;

      // Auto-advance through steps 2, 3, 4 after OCR completes
      if (flowStep === 2) {
        setFormFilled(true);
        flowRunning.current = true;

        // Complete step 1 (RAG), activate step 2 (Form Synthesis)
        setStep(tree.steps[1].stepper, 2);
        if (!uploadedFiles.some(f => f.status === 'verified')) {
          addTranslatedCopilotMsg(tree.steps[2].copilot);
        }
        setStep(tree.steps[2].stepper, 1, tree.steps[2].stepDetail);
        onAddLedgerEntry({ txId: tree.txId, event: `OCR Complete: ${file.name}`, dept: tree.dept });

        setTimeout(() => {
          // Complete step 2, activate step 3 (Routing)
          setStep(tree.steps[2].stepper, 2);
          addTranslatedCopilotMsg(tree.steps[3].copilot);
          setStep(tree.steps[3].stepper, 1, tree.steps[3].stepDetail);
          onAddLedgerEntry({ txId: tree.txId, event: `Routed: ${activeFlow.toUpperCase()}`, dept: tree.dept });
          
          const finalCaseData = { ...tree.caseData };
          if (currentUser && currentUser.name) {
            finalCaseData.name = currentUser.name;
            if (finalCaseData.fields) {
              const updatedFields = { ...finalCaseData.fields };
              Object.keys(updatedFields).forEach(k => {
                if (k.includes('Name') || k.includes('Applicant') || k.includes('Farmer') || k.includes('Informant')) {
                  updatedFields[k] = currentUser.name;
                }
                if (k.includes('Aadhaar') || k.includes('Card Number') || k.includes('Linked Aadhaar')) {
                  if (currentUser.fields && currentUser.fields.aadhaar) {
                    updatedFields[k] = currentUser.fields.aadhaar;
                  }
                }
              });
              finalCaseData.fields = updatedFields;
            }
          }
          onAddApplication(finalCaseData);

          setTimeout(() => {
            // Complete step 3, activate+complete step 4 (Audit)
            setStep(tree.steps[3].stepper, 2);
            addTranslatedCopilotMsg(tree.steps[4].copilot);
            setStep(tree.steps[4].stepper, 2, tree.steps[4].stepDetail);
            onAddLedgerEntry({ txId: tree.txId, event: 'Audit signature registered', dept: tree.dept });
            if (soundEnabled) playSound('success');
            flowRunning.current = false;
            setActiveFlow(null);
          }, 1500);
        }, 1500);
      }
    }, 1500);
  }, [activeFlow, flowStep, soundEnabled, addMsg, addTranslatedCopilotMsg, setStep, onAddLedgerEntry, onAddApplication, currentUser, selectedLanguage, t, uploadedFiles]);

  // Drag and drop
  const handleDragOver = (e) => { e.preventDefault(); dragZoneRef.current?.classList.add('dragover'); };
  const handleDragLeave = () => { dragZoneRef.current?.classList.remove('dragover'); };
  const handleDrop = (e) => {
    e.preventDefault();
    dragZoneRef.current?.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const tree = activeFlow ? conversationTrees[activeFlow] : null;
  const formFields = useMemo(() => {
    if (!tree) return null;
    const rawFields = formFilled ? tree.filledFields : tree.emptyFields;
    return rawFields.map(f => {
      // Substitute name
      if (f.label.includes('Name') || f.label.includes('Applicant') || f.label.includes('Farmer')) {
        if (currentUser && currentUser.name) {
          if (activeFlow === 'death' && f.label.includes('Deceased')) {
            return f;
          }
          return { ...f, value: formFilled ? currentUser.name : '' };
        }
      }
      // Substitute Aadhaar
      if (f.label.includes('Aadhaar') || f.label.includes('Card Number')) {
        if (currentUser && currentUser.fields && currentUser.fields.aadhaar) {
          return { ...f, value: formFilled ? currentUser.fields.aadhaar : '' };
        }
      }
      return f;
    });
  }, [tree, formFilled, currentUser, activeFlow]);

  return (
    <section className="workspace-view active" id="viewCitizen">
      <div className="citizen-grid">
        {/* Chat Panel */}
        <div className="citizen-chat-panel glass-panel">
          <div className="panel-header">
            <div className="header-left">
              <span className="panel-badge green">{t('portal.aiAssistant', 'AI Assistant')}</span>
              <h3>{t('portal.workspaceTitle', 'Citizen Support Workspace')}</h3>
            </div>
            <div className="language-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleResetChat}
                className="nav-btn"
                style={{ padding: '4px 8px', fontSize: '0.85rem', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)' }}
                title={t('portal.resetBtnTitle', 'Reset Chat & Workflow')}
              >
                🔄 {t('portal.newChat', 'New Chat')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceResponseEnabled(!voiceResponseEnabled);
                  if (soundEnabled) playSound('click');
                  if (voiceResponseEnabled && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="nav-btn"
                style={{ padding: '4px 8px', fontSize: '0.85rem', background: voiceResponseEnabled ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)', color: voiceResponseEnabled ? 'var(--accent-green)' : 'var(--text-muted)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)' }}
                title={voiceResponseEnabled ? t('portal.muteBtnTitle', 'Mute response') : t('portal.speakBtnTitle', 'Listen to response')}
              >
                {voiceResponseEnabled ? '🔊' : '🔇'}
              </button>
              <label>{t('portal.language', 'Language')}:</label>
              <select 
                className="form-select-sm"
                value={selectedLanguage}
                onChange={(e) => {
                  const lang = e.target.value;
                  setSelectedLanguage(lang);
                  i18n.changeLanguage(lang);
                  localStorage.setItem('language', lang);
                  if (soundEnabled) playSound('click');
                }}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="pb">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="ur">اردو (Urdu)</option>
                <option value="or">ଓଡ଼িଆ (Odia)</option>
              </select>
            </div>
          </div>

          <div className="chat-viewport" ref={chatRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.sender}`} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ whiteSpace: 'pre-line' }}>{m.text}</span>
                {m.sender === 'copilot' && (
                  <button
                    type="button"
                    onClick={() => speakText(m.text, selectedLanguage, true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', padding: '0 2px', opacity: 0.8, flexShrink: 0 }}
                    title={t('portal.speakBtnTitle', 'Listen to response')}
                  >
                    🔊
                  </button>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chat-msg typing">
                <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
            )}
          </div>

          <div className="chat-chips-scroll">
            <button className="chip-btn" onClick={() => startFlow('license')}>{t('portal.chipLicense', 'Renew Driving License')}</button>
            <button className="chip-btn" onClick={() => startFlow('subsidy')}>{t('portal.chipSubsidy', 'Apply for Agri-Subsidy')}</button>
            <button className="chip-btn" onClick={() => startFlow('birth')}>{t('portal.chipBirth', 'Register Child Birth')}</button>
            <button className="chip-btn" onClick={() => startFlow('death')}>{t('portal.chipDeath', 'Register Death')}</button>
            <button className="chip-btn" onClick={() => startFlow('rythu')}>{t('portal.chipRythu', 'Rythu Bandhu Scheme')}</button>
            <button className="chip-btn" onClick={() => startFlow('aadhaar')}>{t('portal.chipAadhaar', 'Aadhaar Update Process')}</button>
            <button className="chip-btn" onClick={() => startFlow('pan')}>{t('portal.chipPan', 'PAN Apply')}</button>
            <button className="chip-btn" onClick={() => startFlow('income')}>{t('portal.chipIncome', 'Income Certificate')}</button>
            <button className="chip-btn" onClick={() => startFlow('caste')}>{t('portal.chipCaste', 'Caste Certificate')}</button>
          </div>

          <div className="chat-input-bar">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? t('portal.listeningPlaceholder', 'Listening... (speak now)') : t('portal.typePlaceholder', 'Type your query or speak...')}
              disabled={isRecording}
            />
            <button 
              className={`send-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleMicClick}
              title={isRecording ? t('portal.stopRecording', 'Stop Recording') : t('portal.voiceInput', 'Voice Input')}
              style={{
                background: isRecording ? 'var(--accent-red)' : 'var(--bg-tertiary)',
                border: isRecording ? 'none' : '1px solid var(--border-primary)',
                color: isRecording ? '#fff' : 'var(--text-secondary)',
                animation: isRecording ? 'pulse-mic 1.2s infinite alternate' : 'none'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <button className="send-btn" onClick={handleSend} disabled={isRecording}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Tabs Panel */}
        <div className="citizen-forms-panel">
          <div className="tabs-header">
            {['upload', 'form', 'status', 'track'].map(tab => (
              <button
                key={tab}
                className={`tab-link ${activeTab === tab ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab); if (soundEnabled) playSound('click'); }}
              >
                {tab === 'upload' ? t('portal.tabUpload', 'Document Center') : tab === 'form' ? t('portal.tabForm', 'Application Preview') : tab === 'status' ? t('portal.tabStatus', 'Pipeline Tracker') : t('portal.tabTrack', 'My Applications')}
              </button>
            ))}
          </div>

          <div className="tabs-viewport">
            {/* Upload Tab */}
            <div className={`tab-content ${activeTab === 'upload' ? 'active' : ''}`}>
              <div
                className="upload-drag-zone"
                ref={dragZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="icon-upload">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <h4>{t('portal.dragDropTitle', 'Drag & Drop Verification Files')}</h4>
                <p className="text-muted">{t('portal.dragDropSubtitle', 'Or click to select files. Supported: JPG, PNG, PDF (Max 5MB)')}</p>
                <input ref={fileInputRef} type="file" className="hidden-file-input" accept="image/*,application/pdf"
                  onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }}
                />
              </div>

              <div className="upload-list-wrapper">
                <h5>{t('portal.processedDocs', 'Processed Documents (OCR Extraction)')}</h5>
                <div className="upload-list-scroll">
                  {uploadedFiles.length === 0 ? (
                    <div className="upload-empty">{t('portal.noFilesYet', 'No files uploaded yet.')}</div>
                  ) : uploadedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="upload-item"
                      style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(0, 242, 254, 0.25)', background: 'rgba(0, 242, 254, 0.04)' }}
                      onClick={() => setPreviewDoc(f)}
                      title="Click to view & inspect uploaded document"
                    >
                      <div className="upload-item-info">
                        <div className="upload-item-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="upload-item-details">
                          <strong>{f.name}</strong>
                          <span>{f.status === 'scanning' ? t('portal.extractingText', 'Extracting text (OCR running)...') : `${(f.size / (1024 * 1024)).toFixed(2)} MB • ${t('portal.verified', 'Verified')}`}</span>
                        </div>
                      </div>
                      {f.status === 'verified' ? (
                        <span className="ocr-result-badge" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          👁️ {t('portal.ocrVerified', 'OCR verified')}
                        </span>
                      ) : (
                        <span className="ocr-result-badge">{f.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Tab */}
            <div className={`tab-content ${activeTab === 'form' ? 'active' : ''}`}>
              <div className="document-page glass-panel">
                <div className="doc-header">
                  <h4>{t('portal.formHeader', 'OFFICIAL APPLICATION FORM')}</h4>
                  <p className="doc-meta">{tree ? tree.formTitle : t('portal.formMetaDefault', 'Select service to initialize form')}</p>
                </div>
                <div className="doc-form-fields">
                  {formFields ? formFields.map((f, i) => (
                    <div key={i} className="doc-form-group">
                      <label>{f.label}</label>
                      <div className="doc-field-value">{f.value || '\u00A0'}</div>
                    </div>
                  )) : (
                    <div className="form-empty-state">
                      <p>{t('portal.formEmptyState', 'Start a conversation or select a quick template to generate the official application.')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pipeline Tracker Tab */}
            <div className={`tab-content ${activeTab === 'status' ? 'active' : ''}`}>
              <div className="stepper-card glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0 }}>{t('portal.flowTitle', 'End-to-End Execution Flow')}</h4>
                  {activeFlow ? (
                    <span className="panel-badge blue" style={{ animation: 'pulse-mic 1s infinite alternate' }}>
                      {t('portal.flowActive', 'Active')}: {conversationTrees[activeFlow].formTitle}
                    </span>
                  ) : (
                    <span className="panel-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                      {t('portal.flowIdle', 'Pipeline Idle')}
                    </span>
                  )}
                </div>
                <p className="narrative-small">{t('portal.flowNarrative', 'Real-time status of your request routing through the AI back-office orchestration engine.')}</p>
                
                {!activeFlow && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(6, 182, 212, 0.06)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    fontSize: '0.82rem',
                    color: 'var(--accent-cyan)',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span>💡</span>
                    <span>{t('portal.flowTip', 'Select a service chip (e.g., Renew Driving License) on the left to see this pipeline execute live!')}</span>
                  </div>
                )}

                <ul className="progress-stepper">
                  {[
                    { title: t('portal.step1Title', 'Intent Classifying'), desc: t('portal.step1Desc', 'Recognizing user intent and service category') },
                    { title: t('portal.step2Title', 'RAG Document Retrieval'), desc: t('portal.step2Desc', 'Fetching guidelines from official manual index') },
                    { title: t('portal.step3Title', 'Form Synthesis'), desc: t('portal.step3Desc', 'Compiling OCR attachments and filling fields') },
                    { title: t('portal.step4Title', 'Administrative Routing'), desc: t('portal.step4Desc', 'Forwarding packet to officer inbox for signature') },
                    { title: t('portal.step5Title', 'Cryptographic Logging'), desc: t('portal.step5Desc', 'Hashing audit trails into the admin ledger') },
                  ].map((step, i) => (
                    <li key={i} className={`stepper-item ${stepperStates[i] === 1 ? 'active' : ''} ${stepperStates[i] === 2 ? 'completed' : ''}`}>
                      <div className="stepper-icon">{String(i + 1).padStart(2, '0')}</div>
                      <div className="stepper-detail">
                        <strong>{step.title}</strong>
                        <span>{(stepperDescs[i] && stepperDescs[i] !== STEP_LABELS[i].desc) ? stepperDescs[i] : step.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* My Applications Tab */}
            <div className={`tab-content ${activeTab === 'track' ? 'active' : ''}`}>
              <div className="glass-card" style={{ padding: 20 }}>
                <h4 style={{ marginBottom: 12 }}>{t('portal.myAppsTitle', 'My Submitted Applications')}</h4>
                <p className="narrative-small" style={{ marginBottom: 20 }}>{t('portal.myAppsDesc', 'Track the processing status of your submitted digital certificate and relief requests.')}</p>
                
                {myApps.length === 0 ? (
                  <div className="upload-empty" style={{ padding: '30px 20px' }}>{t('portal.noAppsYet', 'You have not submitted any applications yet.')}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {myApps.map((app) => (
                      <div key={app.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-primary)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{app.service}</strong>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{app.id}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {t('portal.submittedLabel', 'Submitted')}: {app.timestamp || t('portal.justNow', 'Just now')}
                          </div>
                        </div>
                        <div>
                          <span className={`status-badge ${app.status.toLowerCase()}`}>{app.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Interactive Document Preview Modal */}
      <DocumentPreviewModal
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        soundEnabled={soundEnabled}
      />
    </section>
  );
}
