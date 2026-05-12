import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch, Image, Linking, Platform, Modal } from 'react-native'
import { doc, getDoc, setDoc, collection, addDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

// --- ATS-OPTIMIZED HTML GENERATOR ---
const generateATSResumeHTML = (resume, showPhoto, theme) => {
  const { personal, summary, summaryLink, education, experience, skills, skillsLink, projects, achievements } = resume;

  const makeLink = (text, url) => url ? `<a href="${url}" target="_blank">${text}</a>` : text;
  const getScoreLabel = (score) => String(score).includes('.') ? 'CGPA' : 'Percentage'

  const formatContent = (text, link, bulletOnMultiple = false) => {
    if (!text) return '';
    let points = text.split(/\n/).map(p => p.trim()).filter(Boolean);
    if (points.length === 1 && text.includes('•')) {
      points = text.split('•').map(p => p.trim()).filter(Boolean);
    }
    if ((bulletOnMultiple && points.length > 1) || points.length > 2) {
      const cleanPoints = points.map(p => p.replace(/^[-•*]\s*/, ''));
      return `<ul>${cleanPoints.map(p => `<li>${makeLink(p, link)}</li>`).join('')}</ul>`;
    }
    return makeLink(text.replace(/\n/g, '<br>'), link);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        /* Strict A4 Page Configuration */
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Arial', Helvetica, sans-serif; color: #000; font-size: 9.5pt; line-height: 1.2; margin: 0; padding: 0; background: #e2e8f0; }
        
        /* Simulated A4 Paper for Web Preview */
        .a4-container { background: #fff; width: 210mm; max-width: 100%; min-height: 297mm; margin: 20px auto; padding: 10mm; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.15); overflow: hidden; }
        
        /* Remove simulation styles when actually printing to PDF */
        @media print { body { background: #fff; } .a4-container { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; } }

        /* ATS-Friendly Typography & Structure */
        * { box-sizing: border-box; }
        h1 { font-size: 18pt; font-weight: bold; text-align: center; margin: 0 0 4px 0; text-transform: uppercase; color: #000000; line-height: 1.05; }
        h2 { font-size: 10.5pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000000; margin: 9px 0 4px 0; padding-bottom: 1px; color: #000000; line-height: 1.1; break-after: avoid; }
        
        .contact-info { text-align: center; font-size: 8.5pt; margin-bottom: 3px; }
        .contact-info a { color: #000; text-decoration: none; }
        .links-bar { text-align: center; font-size: 8.5pt; margin-bottom: 8px; }
        .links-bar a { color: #000000; text-decoration: none; margin: 0 4px; }
        
        .photo-container { text-align: center; margin-bottom: 8px; }
        .photo-container img { width: 58px; height: 58px; border-radius: 29px; object-fit: cover; }
        
        .section-content { text-align: left; }
        .item-block { margin-bottom: 6px; break-inside: avoid; }
        
        .item-header { clear: both; overflow: hidden; margin-bottom: 1px; }
        .item-title { font-weight: bold; float: left; color: #000000; }
        .item-date { float: right; }
        .item-subtitle { font-style: italic; clear: both; }
        
        .item-tech { font-size: 8.5pt; font-weight: bold; margin-bottom: 2px; }
        .item-desc { font-size: 9.25pt; margin-top: 2px; }
        
        ul { margin: 2px 0 0 14px; padding: 0; }
        li { margin-bottom: 2px; }
        p, div, span { orphans: 3; widows: 3; }
      </style>
    </head>
    <body>
      <div class="a4-container">

      <!-- 1. Name -->
      <h1>${makeLink(personal?.name || 'Your Name', personal?.nameLink)}</h1>

      <!-- 2. Photo (Note: ATS parsers often ignore or fail on photos, toggle lets users decide) -->
      ${showPhoto && personal?.photoURL ? `
        <div class="photo-container">
          <img src="${personal.photoURL}" alt="Profile Photo" />
        </div>
      ` : ''}

      <!-- 3. Contact Details -->
      <div class="contact-info">
        ${makeLink(personal?.phone || '', personal?.phoneLink)} 
        ${personal?.phone && personal?.email ? ' | ' : ''} 
        ${personal?.email || ''}
      </div>

      <!-- 4. Links -->
      <div class="links-bar">
        ${personal?.portfolio ? `<a href="${personal.portfolio}">Portfolio</a>` : ''}
        ${personal?.linkedin ? `<a href="${personal.linkedin}">LinkedIn</a>` : ''}
        ${personal?.github ? `<a href="${personal.github}">GitHub</a>` : ''}
        ${personal?.leetcode ? `<a href="${personal.leetcode}">LeetCode</a>` : ''}
      </div>

      ${(() => {
        const sectionsHTML = {
          summary: summary ? `\n        <h2>Professional Summary</h2>\n        <div class="section-content">\n          ${formatContent(summary, summaryLink)}\n        </div>\n      ` : '',
          education: education && education.length > 0 ? `\n        <h2>Education</h2>\n        <div class="section-content">\n          ${education.map(ed => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(ed.institution, ed.institutionLink)}</span>\n                <span class="item-date">${makeLink(ed.duration, ed.durationLink)}</span>\n              </div>\n              <div class="item-subtitle">${makeLink(ed.course, ed.courseLink)}</div>\n              ${ed.score ? `<div>${getScoreLabel(ed.score)}: ${makeLink(ed.score, ed.scoreLink)}</div>` : ''}\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          experience: experience && experience.length > 0 ? `\n        <h2>Work Experience</h2>\n        <div class="section-content">\n          ${experience.map(exp => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(exp.company, exp.companyLink)} | <span style="font-weight:normal">${makeLink(exp.role, exp.roleLink)}</span></span>\n                <span class="item-date">${makeLink(exp.duration, exp.durationLink)}</span>\n              </div>\n              <div class="item-desc">${formatContent(exp.summary, exp.summaryLink, theme.experienceBullets ?? false)}</div>\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          skills: skills ? `\n        <h2>Skills</h2>\n        <div class="section-content">\n          ${makeLink(typeof skills === 'string' ? skills.split('\n').map(line => { const i = line.indexOf(':'); return i !== -1 ? '<strong>' + line.substring(0, i + 1) + '</strong>' + line.substring(i + 1) : line; }).join('<br>') : skills, skillsLink)}\n        </div>\n      ` : '',
          projects: projects && projects.length > 0 ? `\n        <h2>Projects</h2>\n        <div class="section-content">\n          ${projects.map(proj => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(proj.name, proj.nameLink)}${[proj.demoLink && `<a href="${proj.demoLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#000000; text-decoration:none;">[Live Demo]</a>`, proj.docLink && `<a href="${proj.docLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#000000; text-decoration:none;">[Docs]</a>`, proj.videoLink && `<a href="${proj.videoLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#000000; text-decoration:none;">[Video]</a>`, proj.gitLink && `<a href="${proj.gitLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#000000; text-decoration:none;">[GitHub]</a>`].filter(Boolean).slice(0, 2).join('')} | <span style="font-weight:normal">${makeLink(proj.role, proj.roleLink)}</span></span>\n              </div>\n              <div class="item-tech">${makeLink(proj.type, proj.typeLink)} | ${makeLink(proj.techStack, proj.techStackLink)}</div>\n              <div class="item-desc">${formatContent(proj.summary, proj.summaryLink, theme.projectsBullets ?? true)}</div>\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          achievements: achievements && achievements.length > 0 ? `\n        <h2>Accomplishments</h2>\n        <div class="section-content">\n          <ul>\n            ${achievements.map(ach => `<li>${makeLink(ach.text, ach.link)}</li>`).join('')}\n          </ul>\n        </div>\n      ` : ''
        };
        
        return (theme.sectionOrder || ['summary', 'education', 'experience', 'skills', 'projects', 'achievements']).map(sec => sectionsHTML[sec]).join('');
      })()}

      </div>
    </body>
    </html>
  `;
}

export default function BuilderScreen({ user, onGoBack }) {
  const defaultSectionOrder = ['summary', 'education', 'experience', 'skills', 'projects', 'achievements'];
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalResume, setFinalResume] = useState(null)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [progress, setProgress] = useState(0)
  const [showPhoto, setShowPhoto] = useState(false)
  const [clearModalVisible, setClearModalVisible] = useState(false)
  const [theme, setTheme] = useState({ sectionOrder: defaultSectionOrder, projectsBullets: true, experienceBullets: false })
  const [popupState, setPopupState] = useState({ visible: false, title: '', message: '', isError: false })
  const [promptHistory, setPromptHistory] = useState([])
  const progressInterval = useRef(null)

  // Auto-fetch existing tailored resume on load
  useEffect(() => {
    const loadTailoredResume = async () => {
      try {
        const docRef = doc(db, 'resumes', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.tailoredResume) setFinalResume(data.tailoredResume)
          if (data.promptHistory) setPromptHistory(data.promptHistory)
        }
      } catch (error) {
        console.error("Error loading tailored resume:", error)
      }
    }
    loadTailoredResume()
  }, [user.uid])

  const startProgress = () => {
    setProgress(0)
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.floor(Math.random() * 8) + 2
        return next >= 95 ? 95 : next
      })
    }, 300)
  }

  const handleGenerate = async () => {
    if (!jd.trim()) {
      Alert.alert('Missing Info', 'Please paste a Job Description first.')
      setPopupState({ visible: true, title: 'Missing Info', message: 'Please paste a Job Description first.', isError: true })
      return
    }

    setLoading(true)
    startProgress()
    try {
      // 1. Fetch user's baseline resume from DB
      const docRef = doc(db, 'resumes', user.uid)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        clearInterval(progressInterval.current)
        setLoading(false)
        Alert.alert('Error', 'No base resume found. Please fill out your details first.')
        setPopupState({ visible: true, title: 'Error', message: 'No base resume found. Please fill out your details first.', isError: true })
        return
      }
      const baseResume = docSnap.data()

      // 2. The AI Prompt Instructions
      const prompt = `
        You are an expert technical recruiter and resume writer.
        I will provide a Base Resume and a Job Description. 
        1. Analyze the Job Description to extract the core tech stack and requirements.
        2. Rewrite and tailor the 'projects' array and 'summary' from my Base Resume to highlight these specific requirements.${(baseResume.projects?.length || 0) >= 3 ? " Ensure the final 'projects' array contains EXACTLY 3 projects. Choose the most relevant ones." : ""}
        3. For the 'skills' array (list of strings), analyze the user's base skills and the Job Description. You must categorize the user's most relevant skills into the following topics: "Languages", "Web Development", "Backend", "Database", "Frameworks", "Tools".
           - Each item in the returned 'skills' array should be a string like "Topic: Skill1, Skill2, ...".
           - The skills listed MUST come from the user's base skills. Do not invent skills.
           - The order of the topic strings in the array should be based on relevance to the Job Description.
           - If no user skills fit a topic, omit that topic.
           - If a relevant skill from the user's base skills does not fit into any of the predefined topics, you are allowed to create a new, appropriate topic for it.
        4. This resume must fit on a SINGLE A4 page when combined with the user's existing personal, education, experience, and achievements sections.
        5. Do NOT drop, trim, summarize away, or omit important content. Preserve substance and relevance.
        6. Prefer dense, neat resume writing: strong phrasing, compact bullets, minimal fluff, and efficient wording that keeps all meaningful content.
        7. Return ONLY a valid JSON object matching this exact structure: { "roleName": "Extracted Job Title", "summary": "...", "skills": ["..."], "projects": [{ "name": "...", "nameLink": "...", "type": "...", "typeLink": "...", "role": "...", "roleLink": "...", "gitLink": "...", "docLink": "...", "videoLink": "...", "demoLink": "...", "techStack": "...", "techStackLink": "...", "summary": "...", "summaryLink": "..." }] }. Preserve any existing link values from the base resume. Do not include markdown formatting like \`\`\`json.

        Base Resume: ${JSON.stringify({
          summary: baseResume.summary || '',
          skills: baseResume.skills || '',
          education: baseResume.education || [],
          experience: baseResume.experience || [],
          achievements: baseResume.achievements || [],
          projects: baseResume.projects || []
        })}
        Job Description: ${jd}
      `

      // --- REAL AI INTEGRATION ---
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!API_KEY) {
        throw new Error("Missing Gemini API Key! Please check your .env file and restart the server.");
      }

      // 1. Dynamically fetch available models to completely bypass version/region hardcoding
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
      const modelsData = await modelsRes.json();
      if (!modelsRes.ok) {
        throw new Error(modelsData.error?.message || 'Failed to list models');
      }

      const workingModel = modelsData.models?.find(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'));
      if (!workingModel) {
        throw new Error("Your API key does not have access to any Gemini models. Please check your Google Cloud Console.");
      }

      // 2. Use the dynamically found model
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${workingModel.name}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();

      if (!response.ok) {
        // If Google rejects the request, throw their specific error message
        throw new Error(data.error?.message || 'API request failed');
      }

      // Gemini sometimes wraps JSON in markdown blocks (```json ... ```), so we clean it first
      let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiText) {
        throw new Error("Invalid response format from Gemini");
      }

      aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResult = JSON.parse(aiText);

      // 3. Merge AI Results with Base Resume (Personal, Experience, etc. stay default)
      const tailoredResume = {
        ...baseResume,
        baseSkills: baseResume.skills, // Explicitly save original skills
        roleName: aiResult.roleName || 'Tailored Resume',
        summary: aiResult.summary || baseResume.summary || '',
        skills: Array.isArray(aiResult.skills) ? aiResult.skills.join('\n') : (aiResult.skills || ''),
        projects: Array.isArray(aiResult.projects) ? aiResult.projects : [],
      }

      // Save the generated resume to Firestore
      await setDoc(doc(db, 'resumes', user.uid), { tailoredResume, promptHistory: [] }, { merge: true })
      setFinalResume(tailoredResume)
      setPromptHistory([])
      clearInterval(progressInterval.current)
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 500) // Small delay so the user can actually see it hit 100%
    } catch (error) {
      console.error("AI Generation Error:", error)
      clearInterval(progressInterval.current)
      setLoading(false)
      setProgress(0)
      setTimeout(() => setPopupState({ visible: true, title: 'Error', message: error.message || 'Failed to generate tailored resume.', isError: true }), 100)
    }
  }

  const handleRefine = async () => {
    if (!refinePrompt.trim()) {
      Alert.alert('Missing Info', 'Please enter your requested changes.')
      setPopupState({ visible: true, title: 'Missing Info', message: 'Please enter your requested changes.', isError: true })
      return
    }

    setLoading(true)
    startProgress()
    try {
      const prompt = `
        You are an expert technical recruiter, resume writer, and designer.
        Here is the current draft of the resume in JSON:
        ${JSON.stringify(finalResume)}
        
        Here is the current styling theme:
        ${JSON.stringify(theme)}

        ${promptHistory.length > 0 ? `Previous change requests in this session (for context):\n${promptHistory.map((p, i) => `${i + 1}. "${p}"`).join('\n')}\n` : ''}
        The user has requested the following NEW changes to their resume or styling:
        "${refinePrompt}"

        IMPORTANT: For any changes to the 'skills' field, you must categorize skills into the following topics: "Languages", "Web Development", "Backend", "Database", "Frameworks", "Tools".
        The skills you list MUST come from the user's base skills, which are: "${finalResume.baseSkills || ''}". Do not invent skills.
        If a relevant skill from the user's base skills does not fit into any of the predefined topics, you are allowed to create a new, appropriate topic for it.
        If the user asks to add a skill, only add it if it is in their base skills. If it is not, you can inform them in the 'infoMessage'.

        Apply these changes appropriately while keeping the final resume neat enough to fit on a SINGLE A4 page.
        Do NOT remove meaningful content just to save space.
        Prefer denser wording, tighter bullets, and cleaner formatting over content loss.
        
        Return ONLY a valid JSON object. 
        If the user requested layout changes (like adding bullets to experience/projects, or reordering sections like "move skills above education"), include a "theme" object at the root level.
        The "theme" object can include:
        - "sectionOrder": array of exactly these strings defining order: ["summary", "education", "experience", "skills", "projects", "achievements"]
        - "projectsBullets": boolean
        - "experienceBullets": boolean
        If the user requested changes that cannot be fulfilled (e.g., irrelevant to resumes, impossible formatting), include an "infoMessage" string at the root level explaining why.
        The rest of the JSON should contain the updated resume matching the exact structure. Do not include markdown formatting like \`\`\`json.
      `

      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      let refinedResume;
      let generatedMessage = 'Resume updated successfully!';
      let isNotice = false;
      
      if (!API_KEY) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        refinedResume = {
          ...finalResume,
          summary: `[SIMULATED REFINEMENT based on: "${refinePrompt}"]\n\n${finalResume.summary || ''}`
        };
      } else {
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const modelsData = await modelsRes.json();
        if (!modelsRes.ok) throw new Error(modelsData.error?.message || 'Failed to list models');
        
        const workingModel = modelsData.models?.find(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'));
        if (!workingModel) throw new Error("Your API key does not have access to any Gemini models.");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${workingModel.name}:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'API request failed');
        }

        let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) {
          throw new Error("Invalid response format from Gemini");
        }

        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResponse = JSON.parse(aiText);
        
        if (parsedResponse.theme) {
          setTheme(prev => ({ ...prev, ...parsedResponse.theme }));
          delete parsedResponse.theme;
        }
        
        if (parsedResponse.infoMessage) {
          generatedMessage = parsedResponse.infoMessage;
          isNotice = true;
          delete parsedResponse.infoMessage;
        }
        
        refinedResume = parsedResponse;
      }
      refinedResume = {
        ...finalResume,
        ...refinedResume,
        personal: refinedResume.personal || finalResume.personal,
        education: refinedResume.education || finalResume.education,
        experience: refinedResume.experience || finalResume.experience,
        projects: refinedResume.projects || finalResume.projects,
        achievements: refinedResume.achievements || finalResume.achievements,
        skills: Array.isArray(refinedResume.skills) ? refinedResume.skills.join('\n') : (refinedResume.skills || finalResume.skills),
        summary: refinedResume.summary || finalResume.summary,
        roleName: refinedResume.roleName || finalResume.roleName
      }
      const newPromptHistory = [...promptHistory, refinePrompt]

      // Save the updated resume to Firestore
      await setDoc(doc(db, 'resumes', user.uid), { tailoredResume: refinedResume, promptHistory: newPromptHistory }, { merge: true })
      setFinalResume(refinedResume)
      setPromptHistory(newPromptHistory)
      setRefinePrompt('')
      clearInterval(progressInterval.current)
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
        setPopupState({ visible: true, title: isNotice ? 'Notice' : 'Success', message: generatedMessage, isError: isNotice });
      }, 500)
    } catch (error) {
      console.error("AI Refinement Error:", error)
      clearInterval(progressInterval.current)
      setLoading(false)
      setProgress(0)
      setTimeout(() => setPopupState({ visible: true, title: 'Error', message: error.message || 'Failed to refine resume.', isError: true }), 100)
    }
  }

  const executeClear = async () => {
    setClearModalVisible(false)
    setLoading(true)
    try {
      await setDoc(doc(db, 'resumes', user.uid), { tailoredResume: deleteField(), promptHistory: deleteField() }, { merge: true })
      setFinalResume(null)
      setPromptHistory([])
      setJd('')
      setRefinePrompt('')
    } catch (error) {
      console.error("Clear Error:", error)
      setPopupState({ visible: true, title: 'Error', message: 'Failed to clear resume.', isError: true })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setLoading(true);
    const extractedRole = finalResume.roleName || 'Tailored Resume';
    try {
      await addDoc(collection(db, 'userResumes'), {
        userId: user.uid,
        roleName: extractedRole,
        resumeData: finalResume,
        theme: theme,
        createdAt: new Date().toISOString()
      });
      setPopupState({ visible: true, title: 'Success', message: 'Resume saved under ' + extractedRole + '!', isError: false });
    } catch (error) {
      console.error("Save Error:", error);
      setPopupState({ visible: true, title: 'Error', message: 'Failed to save resume.', isError: true });
    } finally {
      setLoading(false);
    }
  }

  const handleExportPDF = async () => {
    try {
      const html = generateATSResumeHTML(finalResume, showPhoto, theme);
      if (Platform.OS === 'web') {
        // On Web, printAsync opens the browser print dialog where the user can "Save as PDF"
        await Print.printAsync({ html });
      } else {
        // On Native (iOS/Android), generate the file silently and open the native share/save sheet
        const { uri } = await Print.printToFileAsync({ 
          html,
          width: 595, // Exact width of A4 in points
          height: 842 // Exact height of A4 in points
        });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      setPopupState({ visible: true, title: 'Export Error', message: 'Failed to generate PDF.', isError: true });
    }
  }

  const getScoreLabel = (score) => String(score).includes('.') ? 'CGPA' : 'Percentage'

  const renderNativeContent = (text, link, bulletOnMultiple = false) => {
    if (!text) return null;
    let points = text.split(/\n/).map(p => p.trim()).filter(Boolean);
    if (points.length === 1 && text.includes('•')) {
      points = text.split('•').map(p => p.trim()).filter(Boolean);
    }
    if ((bulletOnMultiple && points.length > 1) || points.length > 2) {
      const cleanPoints = points.map(p => p.replace(/^[-•*]\s*/, ''));
      return (
        <View style={{ marginLeft: 10, marginTop: 4 }}>
          {cleanPoints.map((p, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={styles.resumeText}>• </Text>
              {link ? (
                <TouchableOpacity onPress={() => Linking.openURL(link)} style={{ flex: 1 }}>
                  <Text style={[styles.resumeText, styles.linkableText]}>{p}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.resumeText, { flex: 1 }]}>{p}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    
    return link ? (
      <TouchableOpacity onPress={() => Linking.openURL(link)}>
        <Text style={[styles.resumeText, styles.linkableText, { marginTop: 4 }]}>{text}</Text>
      </TouchableOpacity>
    ) : (
      <Text style={[styles.resumeText, { marginTop: 4 }]}>{text}</Text>
    );
  };

  const renderWebPreviewText = (text, bulletOnMultiple = false) => {
    if (!text) return null
    let points = text.split(/\n/).map(p => p.trim()).filter(Boolean)
    if (points.length === 1 && text.includes('â€¢')) {
      points = text.split('â€¢').map(p => p.trim()).filter(Boolean)
    }

    if ((bulletOnMultiple && points.length > 1) || points.length > 2) {
      const cleanPoints = points.map(p => p.replace(/^[-â€¢*]\s*/, ''))
      return cleanPoints.map((point, idx) => (
        <Text key={idx} style={styles.webPreviewBullet}>• {point}</Text>
      ))
    }

    return <Text style={styles.webPreviewBody}>{text}</Text>
  }

  const WebResumeContent = React.memo(({ finalResume, theme }) => {
      const webSections = {
        summary: finalResume.summary ? (
          <View key="summary" style={styles.webPreviewSection}>
            <Text style={styles.webPreviewHeading}>Summary</Text>
            {renderWebPreviewText(finalResume.summary)}
          </View>
        ) : null,
        education: finalResume.education?.length ? (
          <View key="education" style={styles.webPreviewSection}>
            <Text style={styles.webPreviewHeading}>Education</Text>
            {finalResume.education.map((ed, idx) => (
              <View key={idx} style={styles.webPreviewItem}>
                <View style={styles.webPreviewItemHeader}>
                  <Text style={styles.webPreviewStrong}>{ed.institution}</Text>
                  <Text style={styles.webPreviewMuted}>{ed.duration}</Text>
                </View>
                <Text style={styles.webPreviewBody}>{ed.course}</Text>
                {ed.score ? <Text style={styles.webPreviewMuted}>{getScoreLabel(ed.score)}: {ed.score}</Text> : null}
              </View>
            ))}
          </View>
        ) : null,
        experience: finalResume.experience?.length ? (
          <View key="experience" style={styles.webPreviewSection}>
            <Text style={styles.webPreviewHeading}>Work Experience</Text>
            {finalResume.experience.map((exp, idx) => (
              <View key={idx} style={styles.webPreviewItem}>
                <View style={styles.webPreviewItemHeader}>
                  <Text style={styles.webPreviewStrong}>{[exp.company, exp.role].filter(Boolean).join(' | ')}</Text>
                  {exp.duration ? <Text style={styles.webPreviewMuted}>{exp.duration}</Text> : null}
                </View>
                {renderWebPreviewText(exp.summary, theme.experienceBullets ?? false)}
              </View>
            ))}
          </View>
        ) : null,
        skills: finalResume.skills ? (
          <View key="skills" style={styles.webPreviewSection}>
            <Text style={styles.webPreviewHeading}>Skills</Text>
            {typeof finalResume.skills === 'string' ? finalResume.skills.split('\n').map((line, idx) => {
              const colonIdx = line.indexOf(':');
              if (colonIdx !== -1) {
                return <Text key={idx} style={styles.webPreviewBody}><Text style={{ fontWeight: 'bold' }}>{line.substring(0, colonIdx + 1)}</Text>{line.substring(colonIdx + 1)}</Text>;
              }
              return <Text key={idx} style={styles.webPreviewBody}>{line}</Text>;
            }) : <Text style={styles.webPreviewBody}>{finalResume.skills}</Text>}
          </View>
        ) : null,
        projects: finalResume.projects?.length ? (
          <View key="projects" style={styles.webPreviewSection}>
            <Text style={styles.webPreviewHeading}>Projects</Text>
            {finalResume.projects.map((proj, idx) => (
              <View key={idx} style={styles.webPreviewItem}>
                <Text style={styles.webPreviewStrong}>{[proj.name, proj.role].filter(Boolean).join(' | ')}</Text>
                <Text style={styles.webPreviewMuted}>{[proj.type, proj.techStack].filter(Boolean).join(' | ')}</Text>
                {renderWebPreviewText(proj.summary, theme.projectsBullets ?? true)}
              </View>
            ))}
          </View>
        ) : null,
        achievements: finalResume.achievements?.length ? (
          <View key="achievements" style={styles.webPreviewSection}>
            <Text style={styles.webPreviewHeading}>Accomplishments</Text>
            {finalResume.achievements.map((ach, idx) => (
              <Text key={idx} style={styles.webPreviewBullet}>• {ach.text}</Text>
            ))}
          </View>
        ) : null
      };

      return (
        <View style={styles.webCompactCard}>
            <Text style={styles.webPreviewName}>{finalResume.personal?.name}</Text>
            <Text style={styles.webPreviewMeta}>
              {[finalResume.personal?.phone, finalResume.personal?.email].filter(Boolean).join(' | ')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              {finalResume.personal?.portfolio ? <Text style={styles.webPreviewLinkItem} onPress={() => Linking.openURL(finalResume.personal.portfolio)}>Portfolio</Text> : null}
              {finalResume.personal?.linkedin ? <Text style={styles.webPreviewLinkItem} onPress={() => Linking.openURL(finalResume.personal.linkedin)}>LinkedIn</Text> : null}
              {finalResume.personal?.github ? <Text style={styles.webPreviewLinkItem} onPress={() => Linking.openURL(finalResume.personal.github)}>GitHub</Text> : null}
              {finalResume.personal?.leetcode ? <Text style={styles.webPreviewLinkItem} onPress={() => Linking.openURL(finalResume.personal.leetcode)}>LeetCode</Text> : null}
            </View>
            {(theme.sectionOrder || defaultSectionOrder).map(sec => webSections[sec])}
        </View>
      );
  });

  const renderWebResumePreview = () => {
    return (
      <View style={styles.webA4Sheet}>
        <WebResumeContent finalResume={finalResume} theme={theme} />
      </View>
    );
  };

  return (
    <View style={styles.container}>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        {!finalResume ? (
          <>
            <Text style={styles.label}>Paste Job Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholderTextColor="#64748B"
              placeholder="Paste the role, requirements, and tech stack here..." 
              value={jd} 
              onChangeText={setJd} 
              multiline 
            />

            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={loading}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.generateButtonText}>Generating... {progress}%</Text>
                </View>
              ) : <Text style={styles.generateButtonText}>Generate with AI</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.resultContainer}>
              <View style={styles.resultHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Resume Generated!</Text>
                  <Text style={styles.resultDesc}>Review your tailored resume below. The layout is compressed to keep full content neatly within A4.</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={loading}>
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <View style={[styles.photoToggleContainer, { marginLeft: 16 }]}>
                    <Text style={styles.photoToggleLabel}>Show Photo</Text>
                    <Switch 
                      value={showPhoto} 
                      onValueChange={setShowPhoto} 
                      trackColor={{ false: "#334155", true: "#3B82F6" }}
                      thumbColor={"#f4f3f4"}
                    />
                  </View>
                </View>
              </View>

              {/* VISUAL RESUME LAYOUT */}
              {Platform.OS === 'web' ? (
                <View style={styles.webPreviewShell}>
                  <ScrollView style={styles.webPreviewScroller} contentContainerStyle={styles.webPreviewContent}>
                    {renderWebResumePreview()}
                  </ScrollView>
                </View>
              ) : (
                <View style={[styles.resumePreview, Platform.OS === 'web' && styles.webResumePreview]}>
                
                {/* 1. Name */}
                {finalResume.personal?.nameLink ? (
                  <TouchableOpacity onPress={() => Linking.openURL(finalResume.personal.nameLink)}>
                    <Text style={[styles.resumeName, styles.linkableText]}>{finalResume.personal?.name}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resumeName}>{finalResume.personal?.name}</Text>
                )}

                {/* 2. Photo (Conditional) */}
                {showPhoto && finalResume.personal?.photoURL && (
                  <Image source={{ uri: finalResume.personal.photoURL }} style={styles.resumePhoto} />
                )}

                {/* 3. Contact Details */}
                <View style={styles.resumeContacts}>
                  {finalResume.personal?.phone ? (
                    finalResume.personal.phoneLink ? (
                      <TouchableOpacity onPress={() => Linking.openURL(finalResume.personal.phoneLink)}>
                        <Text style={[styles.resumeContactItem, styles.linkableText]}>{finalResume.personal.phone}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.resumeContactItem}>{finalResume.personal.phone}</Text>
                    )
                  ) : null}
                  
                  {finalResume.personal?.phone && finalResume.personal?.email ? <Text style={styles.resumeContactItem}>  |  </Text> : null}
                  
                  {finalResume.personal?.email ? <Text style={styles.resumeContactItem}>{finalResume.personal.email}</Text> : null}
                </View>

                {/* 4. Links */}
                <View style={styles.resumeLinks}>
                  {finalResume.personal?.portfolio ? <TouchableOpacity onPress={() => Linking.openURL(finalResume.personal.portfolio)}><Text style={styles.resumeLinkItem}>Portfolio</Text></TouchableOpacity> : null}
                  {finalResume.personal?.linkedin ? <TouchableOpacity onPress={() => Linking.openURL(finalResume.personal.linkedin)}><Text style={styles.resumeLinkItem}>LinkedIn</Text></TouchableOpacity> : null}
                  {finalResume.personal?.github ? <TouchableOpacity onPress={() => Linking.openURL(finalResume.personal.github)}><Text style={styles.resumeLinkItem}>GitHub</Text></TouchableOpacity> : null}
                  {finalResume.personal?.leetcode ? <TouchableOpacity onPress={() => Linking.openURL(finalResume.personal.leetcode)}><Text style={styles.resumeLinkItem}>LeetCode</Text></TouchableOpacity> : null}
                </View>

                <View style={styles.resumeDivider} />

                {(() => {
                  const nativeSections = {
                    summary: finalResume.summary ? (
                      <View key="summary">
                        <Text style={styles.resumeSectionTitle}>Summary</Text>
                        {renderNativeContent(finalResume.summary, finalResume.summaryLink)}
                      </View>
                    ) : null,
                    education: finalResume.education && finalResume.education.length > 0 ? (
                      <View key="education">
                        <Text style={styles.resumeSectionTitle}>Education</Text>
                        {finalResume.education.map((ed, idx) => (
                          <View key={idx} style={styles.resumeItemBlock}>
                            <View style={styles.resumeItemHeader}>
                              {ed.institutionLink ? <TouchableOpacity onPress={() => Linking.openURL(ed.institutionLink)}><Text style={[styles.resumeItemTitle, styles.linkableText]}>{ed.institution}</Text></TouchableOpacity> : <Text style={styles.resumeItemTitle}>{ed.institution}</Text>}
                              {ed.durationLink ? <TouchableOpacity onPress={() => Linking.openURL(ed.durationLink)}><Text style={[styles.resumeItemDate, styles.linkableText]}>{ed.duration}</Text></TouchableOpacity> : <Text style={styles.resumeItemDate}>{ed.duration}</Text>}
                            </View>
                            {ed.courseLink ? <TouchableOpacity onPress={() => Linking.openURL(ed.courseLink)}><Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{ed.course}</Text></TouchableOpacity> : <Text style={styles.resumeItemSubtitle}>{ed.course}</Text>}
                            {ed.score ? (ed.scoreLink ? <TouchableOpacity onPress={() => Linking.openURL(ed.scoreLink)}><Text style={[styles.resumeText, styles.linkableText]}>{getScoreLabel(ed.score)}: {ed.score}</Text></TouchableOpacity> : <Text style={styles.resumeText}>{getScoreLabel(ed.score)}: {ed.score}</Text>) : null}
                          </View>
                        ))}
                      </View>
                    ) : null,
                    experience: finalResume.experience && finalResume.experience.length > 0 ? (
                      <View key="experience">
                        <Text style={styles.resumeSectionTitle}>Work Experience</Text>
                        {finalResume.experience.map((exp, idx) => (
                          <View key={idx} style={styles.resumeItemBlock}>
                            <View style={styles.resumeItemHeader}>
                              {exp.companyLink ? <TouchableOpacity onPress={() => Linking.openURL(exp.companyLink)}><Text style={[styles.resumeItemTitle, styles.linkableText]}>{exp.company}</Text></TouchableOpacity> : <Text style={styles.resumeItemTitle}>{exp.company}</Text>}
                              {exp.durationLink ? <TouchableOpacity onPress={() => Linking.openURL(exp.durationLink)}><Text style={[styles.resumeItemDate, styles.linkableText]}>{exp.duration}</Text></TouchableOpacity> : <Text style={styles.resumeItemDate}>{exp.duration}</Text>}
                            </View>
                            {exp.roleLink ? <TouchableOpacity onPress={() => Linking.openURL(exp.roleLink)}><Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{exp.role}</Text></TouchableOpacity> : <Text style={styles.resumeItemSubtitle}>{exp.role}</Text>}
                            {renderNativeContent(exp.summary, exp.summaryLink, theme.experienceBullets ?? false)}
                          </View>
                        ))}
                      </View>
                    ) : null,
                    skills: finalResume.skills ? (
                      <View key="skills">
                        <Text style={styles.resumeSectionTitle}>Skills</Text>
                        {finalResume.skillsLink ? (
                          <TouchableOpacity onPress={() => Linking.openURL(finalResume.skillsLink)}>
                            {typeof finalResume.skills === 'string' ? finalResume.skills.split('\n').map((line, idx) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx !== -1) {
                                return <Text key={idx} style={[styles.resumeText, styles.linkableText]}><Text style={{ fontWeight: 'bold' }}>{line.substring(0, colonIdx + 1)}</Text>{line.substring(colonIdx + 1)}</Text>;
                              }
                              return <Text key={idx} style={[styles.resumeText, styles.linkableText]}>{line}</Text>;
                            }) : <Text style={[styles.resumeText, styles.linkableText]}>{finalResume.skills}</Text>}
                          </TouchableOpacity>
                        ) : (
                          <View>
                            {typeof finalResume.skills === 'string' ? finalResume.skills.split('\n').map((line, idx) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx !== -1) {
                                return <Text key={idx} style={styles.resumeText}><Text style={{ fontWeight: 'bold' }}>{line.substring(0, colonIdx + 1)}</Text>{line.substring(colonIdx + 1)}</Text>;
                              }
                              return <Text key={idx} style={styles.resumeText}>{line}</Text>;
                            }) : <Text style={styles.resumeText}>{finalResume.skills}</Text>}
                          </View>
                        )}
                      </View>
                    ) : null,
                    projects: finalResume.projects && finalResume.projects.length > 0 ? (
                      <View key="projects">
                        <Text style={styles.resumeSectionTitle}>Projects</Text>
                        {finalResume.projects.map((proj, idx) => {
                          const topLinks = [proj.demoLink && { url: proj.demoLink, label: 'Live Demo' }, proj.docLink && { url: proj.docLink, label: 'Docs' }, proj.videoLink && { url: proj.videoLink, label: 'Video' }, proj.gitLink && { url: proj.gitLink, label: 'GitHub' }].filter(Boolean).slice(0, 2);
                          return (
                            <View key={idx} style={styles.resumeItemBlock}>
                              <View style={styles.resumeItemHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', flex: 1 }}>
                                  {proj.nameLink ? <TouchableOpacity onPress={() => Linking.openURL(proj.nameLink)}><Text style={[styles.resumeItemTitle, styles.linkableText]}>{proj.name}</Text></TouchableOpacity> : <Text style={styles.resumeItemTitle}>{proj.name}</Text>}
                                  {topLinks.map((link, i) => <TouchableOpacity key={i} onPress={() => Linking.openURL(link.url)}><Text style={[styles.projectLinkItem, { marginLeft: 8, fontSize: 11 }]}>[{link.label}]</Text></TouchableOpacity>)}
                                </View>
                                {proj.roleLink ? <TouchableOpacity onPress={() => Linking.openURL(proj.roleLink)}><Text style={[styles.resumeItemDate, styles.linkableText]}>{proj.role}</Text></TouchableOpacity> : <Text style={styles.resumeItemDate}>{proj.role}</Text>}
                              </View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
                                {proj.typeLink ? <TouchableOpacity onPress={() => Linking.openURL(proj.typeLink)}><Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{proj.type}</Text></TouchableOpacity> : <Text style={styles.resumeItemSubtitle}>{proj.type}</Text>}
                                <Text style={styles.resumeItemSubtitle}> | </Text>
                                {proj.techStackLink ? <TouchableOpacity onPress={() => Linking.openURL(proj.techStackLink)}><Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{proj.techStack}</Text></TouchableOpacity> : <Text style={styles.resumeItemSubtitle}>{proj.techStack}</Text>}
                              </View>
                              {renderNativeContent(proj.summary, proj.summaryLink, theme.projectsBullets ?? true)}
                            </View>
                          )
                        })}
                      </View>
                    ) : null,
                    achievements: finalResume.achievements && finalResume.achievements.length > 0 ? (
                      <View key="achievements">
                        <Text style={styles.resumeSectionTitle}>Accomplishments</Text>
                        {finalResume.achievements.map((ach, idx) => (
                          <View key={idx} style={styles.resumeItemBlock}>
                            {ach.link ? <TouchableOpacity onPress={() => Linking.openURL(ach.link)}><Text style={[styles.resumeText, styles.linkableText]}>• {ach.text}</Text></TouchableOpacity> : <Text style={styles.resumeText}>• {ach.text}</Text>}
                          </View>
                        ))}
                      </View>
                    ) : null
                  };
                  return (theme.sectionOrder || ['summary', 'education', 'experience', 'skills', 'projects', 'achievements']).map(sec => nativeSections[sec]);
                })()}
                </View>
              )}
            </View>

            <Text style={[styles.label, { marginTop: 24 }]}>Request Changes</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { height: 100 }]} 
              placeholderTextColor="#64748B"
              placeholder="E.g., 'Make the summary sound more professional' or 'Add a bullet point about React hooks'" 
              value={refinePrompt} 
              onChangeText={setRefinePrompt} 
              multiline 
            />
            <TouchableOpacity style={styles.generateButton} onPress={handleRefine} disabled={loading}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.generateButtonText}>Updating... {progress}%</Text>
                </View>
              ) : <Text style={styles.generateButtonText}>Update Resume</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={() => setClearModalVisible(true)} disabled={loading}>
              <Text style={styles.clearButtonText}>Clear Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.generateButton, { backgroundColor: '#10B981', marginTop: 12 }]} onPress={handleExportPDF} disabled={loading}>
              <Text style={styles.generateButtonText}>Export as PDF</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Custom Clear Modal */}
      <Modal visible={clearModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear Resume</Text>
            <Text style={styles.modalMessage}>Are you sure you want to clear your tailored resume? This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setClearModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={executeClear} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generic Popup Modal */}
      <Modal visible={popupState.visible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.successModalTitle, popupState.isError && { color: '#EF4444' }]}>{popupState.title}</Text>
            <Text style={styles.modalMessage}>{popupState.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setPopupState({ ...popupState, visible: false })} style={[styles.modalConfirmBtn, { backgroundColor: popupState.isError ? '#EF4444' : '#10B981' }]}>
                <Text style={styles.modalConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 14, fontSize: 15, color: '#F8FAFC', marginBottom: 20 },
  textArea: { height: 160, textAlignVertical: 'top' },
  generateButton: { backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  clearButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  clearButtonText: { color: '#F87171', fontSize: 16, fontWeight: 'bold' },
  confirmButton: { backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  resultContainer: { 
    marginTop: 30, 
    backgroundColor: '#1E293B', 
    padding: 16, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  successTitle: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginBottom: 8 },
  resultDesc: { fontSize: 14, color: '#94A3B8', marginBottom: 16 },
  webPreviewShell: {
    height: 720,
    maxHeight: 720,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A'
  },
  webPreviewScroller: {
    height: '100%',
    maxHeight: '100%',
    overflow: 'scroll',
    backgroundColor: '#0F172A'
  },
  webPreviewContent: {
    padding: 12,
    minHeight: '100%'
  },
  webResumePreview: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 900,
    flexShrink: 1
  },
  webA4Sheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760,
    minHeight: 1075,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  webCompactCard: {
    paddingVertical: 28,
    paddingHorizontal: 32,
  },
  webPreviewName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 6
  },
  webPreviewMeta: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
        marginBottom: 4
      },
      webPreviewLinkItem: {
        fontSize: 13,
        color: '#2563EB',
        textDecorationLine: 'underline'
  },
  webPreviewSection: {
    marginBottom: 18
  },
  webPreviewHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  webPreviewItem: {
    marginBottom: 12
  },
      webPreviewItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2
      },
  webPreviewStrong: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2
  },
  webPreviewMuted: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4
  },
  webPreviewBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19
  },
  webPreviewBullet: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginBottom: 4
  },
  jsonOutput: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#F8FAFC',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8
  },
  resultHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  photoToggleContainer: { alignItems: 'center' },
  photoToggleLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  resumePreview: { backgroundColor: '#fff', padding: 24, borderRadius: 8 },
  resumeName: { fontSize: 24, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 8 },
  resumePhoto: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 12 },
  resumeContacts: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 },
  resumeContactItem: { fontSize: 13, color: '#333' },
  resumeLinks: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  resumeLinkItem: { fontSize: 13, color: '#0066cc', textDecorationLine: 'underline' },
  resumeDivider: { height: 1, backgroundColor: '#ccc', marginVertical: 12 },
  resumeSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 12, marginTop: 16, textTransform: 'uppercase' },
  resumeText: { fontSize: 13, color: '#333', lineHeight: 20 },
  linkableText: { color: '#0066cc', textDecorationLine: 'underline' },
  resumeItemBlock: { marginBottom: 16 },
  resumeItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  resumeItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  resumeItemDate: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  resumeItemSubtitle: { fontSize: 13, fontWeight: '600', color: '#444' },
  projectLinks: { flexDirection: 'row', gap: 12, marginTop: 6 },
  projectLinkItem: { fontSize: 12, color: '#0066cc', textDecorationLine: 'underline' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  successModalTitle: { color: '#10B981', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalMessage: { color: '#94A3B8', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 12 },
  modalCancelText: { color: '#94A3B8', fontWeight: '600' },
  modalConfirmBtn: { backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' }
})
