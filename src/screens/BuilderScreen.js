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

  const formatContent = (text, link) => {
    if (!text) return '';
    let points = text.split(/\n/).map(p => p.trim()).filter(Boolean);
    if (points.length === 1 && text.includes('•')) {
      points = text.split('•').map(p => p.trim()).filter(Boolean);
    }
    if (points.length > 2) {
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
        @page { size: A4; margin: 15mm; }
        body { font-family: '${theme.font}', Helvetica, sans-serif; color: #000; font-size: 11pt; line-height: 1.4; margin: 0; padding: 0; background: #e2e8f0; }
        
        /* Simulated A4 Paper for Web Preview */
        .a4-container { background: #fff; width: 210mm; max-width: 100%; min-height: 297mm; margin: 20px auto; padding: 15mm; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
        
        /* Remove simulation styles when actually printing to PDF */
        @media print { body { background: #fff; } .a4-container { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; } }

        /* ATS-Friendly Typography & Structure */
        h1 { font-size: 22pt; font-weight: bold; text-align: ${theme.align}; margin: 0 0 5px 0; text-transform: uppercase; color: ${theme.color}; }
        h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid ${theme.color}; margin: 15px 0 8px 0; padding-bottom: 2px; color: ${theme.color}; }
        
        .contact-info { text-align: ${theme.align}; font-size: 10pt; margin-bottom: 5px; }
        .contact-info a { color: #000; text-decoration: none; }
        .links-bar { text-align: ${theme.align}; font-size: 10pt; margin-bottom: 15px; }
        .links-bar a { color: ${theme.color}; text-decoration: none; margin: 0 5px; }
        
        .photo-container { text-align: ${theme.align}; margin-bottom: 15px; }
        .photo-container img { width: 80px; height: 80px; border-radius: 40px; }
        
        .section-content { text-align: left; }
        .item-block { margin-bottom: 12px; }
        
        .item-header { clear: both; overflow: hidden; margin-bottom: 2px; }
        .item-title { font-weight: bold; float: left; color: ${theme.color}; }
        .item-date { float: right; }
        .item-subtitle { font-style: italic; clear: both; }
        
        .item-tech { font-size: 10pt; font-weight: bold; margin-bottom: 4px; }
        .item-desc { font-size: 11pt; margin-top: 4px; }
        
        ul { margin: 5px 0 0 20px; padding: 0; }
        li { margin-bottom: 4px; }
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

      <!-- 5. Summary -->
      ${summary ? `
        <h2>Professional Summary</h2>
        <div class="section-content">
          ${formatContent(summary, summaryLink)}
        </div>
      ` : ''}

      <!-- 6. Education -->
      ${education && education.length > 0 ? `
        <h2>Education</h2>
        <div class="section-content">
          ${education.map(ed => `
            <div class="item-block">
              <div class="item-header">
                <span class="item-title">${makeLink(ed.institution, ed.institutionLink)}</span>
                <span class="item-date">${makeLink(ed.duration, ed.durationLink)}</span>
              </div>
              <div class="item-subtitle">${makeLink(ed.course, ed.courseLink)}</div>
              ${ed.score ? `<div>Score: ${makeLink(ed.score, ed.scoreLink)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Work Experience -->
      ${experience && experience.length > 0 ? `
        <h2>Work Experience</h2>
        <div class="section-content">
          ${experience.map(exp => `
            <div class="item-block">
              <div class="item-header">
                <span class="item-title">${makeLink(exp.company, exp.companyLink)} | <span style="font-weight:normal">${makeLink(exp.role, exp.roleLink)}</span></span>
                <span class="item-date">${makeLink(exp.duration, exp.durationLink)}</span>
              </div>
              <div class="item-desc">${formatContent(exp.summary, exp.summaryLink)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 7. Skills -->
      ${skills ? `
        <h2>Skills</h2>
        <div class="section-content">
          ${makeLink(skills, skillsLink)}
        </div>
      ` : ''}

      <!-- 8. Projects -->
      ${projects && projects.length > 0 ? `
        <h2>Projects</h2>
        <div class="section-content">
          ${projects.map(proj => `
            <div class="item-block">
              <div class="item-header">
                <span class="item-title">${makeLink(proj.name, proj.nameLink)}${[
                  proj.demoLink && `<a href="${proj.demoLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[Live Demo]</a>`,
                  proj.docLink && `<a href="${proj.docLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[Docs]</a>`,
                  proj.videoLink && `<a href="${proj.videoLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[Video]</a>`,
                  proj.gitLink && `<a href="${proj.gitLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[GitHub]</a>`
                ].filter(Boolean).slice(0, 2).join('')} | <span style="font-weight:normal">${makeLink(proj.role, proj.roleLink)}</span></span>
              </div>
              <div class="item-tech">${makeLink(proj.type, proj.typeLink)} | ${makeLink(proj.techStack, proj.techStackLink)}</div>
              <div class="item-desc">${formatContent(proj.summary, proj.summaryLink)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- 9. Accomplishments/Achievements -->
      ${achievements && achievements.length > 0 ? `
        <h2>Accomplishments</h2>
        <div class="section-content">
          <ul>
            ${achievements.map(ach => `<li>${makeLink(ach.text, ach.link)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      </div>
    </body>
    </html>
  `;
}

export default function BuilderScreen({ user, onGoBack }) {
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalResume, setFinalResume] = useState(null)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [progress, setProgress] = useState(0)
  const [showPhoto, setShowPhoto] = useState(false)
  const [clearModalVisible, setClearModalVisible] = useState(false)
  const [theme, setTheme] = useState({ font: 'Arial', color: '#000000', align: 'center' })
  const progressInterval = useRef(null)

  // Auto-fetch existing tailored resume on load
  useEffect(() => {
    const loadTailoredResume = async () => {
      try {
        const docRef = doc(db, 'resumes', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists() && docSnap.data().tailoredResume) {
          setFinalResume(docSnap.data().tailoredResume)
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
        return
      }
      const baseResume = docSnap.data()

      // 2. The AI Prompt Instructions
      const prompt = `
        You are an expert technical recruiter and resume writer.
        I will provide a Base Resume and a Job Description. 
        1. Analyze the Job Description to extract the core tech stack and requirements.
        2. Rewrite and tailor ONLY the 'projects' array from my Base Resume to highlight these specific requirements.${(baseResume.projects?.length || 0) >= 3 ? " Ensure the final 'projects' array contains EXACTLY 3 projects. Choose the most relevant ones." : ""}
        3. Extract a tailored 'skills' array (list of strings) based on my background and the JD.
        4. Return ONLY a valid JSON object matching this exact structure: { "roleName": "Extracted Job Title", "skills": ["..."], "projects": [{ "name": "...", "nameLink": "...", "type": "...", "typeLink": "...", "role": "...", "roleLink": "...", "gitLink": "...", "docLink": "...", "videoLink": "...", "demoLink": "...", "techStack": "...", "techStackLink": "...", "summary": "...", "summaryLink": "..." }] }. Preserve any existing link values from the base resume. Do not include markdown formatting like \`\`\`json.

        Base Resume: ${JSON.stringify({ projects: baseResume.projects, skills: baseResume.skills || '' })}
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
        roleName: aiResult.roleName || 'Tailored Resume',
        skills: aiResult.skills.join(', '),
        projects: aiResult.projects,
      }

      // Save the generated resume to Firestore
      await setDoc(doc(db, 'resumes', user.uid), { tailoredResume }, { merge: true })
      setFinalResume(tailoredResume)
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
      // Using setTimeout allows React to unmount the loading UI before blocking the web thread with the Alert
      setTimeout(() => Alert.alert('Error', error.message || 'Failed to generate tailored resume.'), 100)
    }
  }

  const handleRefine = async () => {
    if (!refinePrompt.trim()) {
      Alert.alert('Missing Info', 'Please enter your requested changes.')
      return
    }

    setLoading(true)
    startProgress()
    try {
      const prompt = `
        You are an expert technical recruiter and resume writer.
        Here is the current draft of the resume in JSON:
        ${JSON.stringify(finalResume)}

        The user has requested the following changes to their resume:
        "${refinePrompt}"

        Apply these changes appropriately and return ONLY a valid JSON object matching the exact structure. Do not include markdown formatting like \`\`\`json.
      `

      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      let refinedResume;
      
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
        refinedResume = JSON.parse(aiText);
      }
      
      // Save the updated resume to Firestore
      await setDoc(doc(db, 'resumes', user.uid), { tailoredResume: refinedResume }, { merge: true })
      setFinalResume(refinedResume)
      setRefinePrompt('')
      clearInterval(progressInterval.current)
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      console.error("AI Refinement Error:", error)
      clearInterval(progressInterval.current)
      setLoading(false)
      setProgress(0)
      setTimeout(() => Alert.alert('Error', error.message || 'Failed to refine resume.'), 100)
    }
  }

  const executeClear = async () => {
    setClearModalVisible(false)
    setLoading(true)
    try {
      await setDoc(doc(db, 'resumes', user.uid), { tailoredResume: deleteField() }, { merge: true })
      setFinalResume(null)
      setJd('')
      setRefinePrompt('')
    } catch (error) {
      console.error("Clear Error:", error)
      Alert.alert('Error', 'Failed to clear resume.')
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
      if (Platform.OS === 'web') window.alert('Resume saved under ' + extractedRole + '!');
      else Alert.alert('Success', 'Resume saved under ' + extractedRole + '!');
    } catch (error) {
      console.error("Save Error:", error);
      if (Platform.OS === 'web') window.alert('Failed to save resume.');
      else Alert.alert('Error', 'Failed to save resume.');
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
      Alert.alert("Export Error", "Failed to generate PDF.");
    }
  }

  const renderNativeContent = (text, link) => {
    if (!text) return null;
    let points = text.split(/\n/).map(p => p.trim()).filter(Boolean);
    if (points.length === 1 && text.includes('•')) {
      points = text.split('•').map(p => p.trim()).filter(Boolean);
    }
    if (points.length > 2) {
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
                  <Text style={styles.resultDesc}>Review your tailored resume below. Request changes if needed.</Text>
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

              {/* Theme Customization Toolbar */}
              {Platform.OS === 'web' && (
                <View style={styles.themeToolbar}>
                  <View style={styles.themeGroup}>
                    <Text style={styles.themeLabel}>Font:</Text>
                    {['Arial', 'Times New Roman', 'Courier New'].map(f => (
                      <TouchableOpacity key={f} onPress={() => setTheme({...theme, font: f})} style={[styles.themePill, theme.font === f && styles.themePillActive]}>
                        <Text style={[styles.themePillText, theme.font === f && styles.themePillTextActive]}>{f.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.themeGroup}>
                    <Text style={styles.themeLabel}>Color:</Text>
                    {['#000000', '#1D4ED8', '#047857'].map(c => (
                      <TouchableOpacity key={c} onPress={() => setTheme({...theme, color: c})} style={[styles.colorDot, { backgroundColor: c }, theme.color === c && styles.colorDotActive]} />
                    ))}
                  </View>
                  <View style={styles.themeGroup}>
                    <Text style={styles.themeLabel}>Align:</Text>
                    {['left', 'center'].map(a => (
                      <TouchableOpacity key={a} onPress={() => setTheme({...theme, align: a})} style={[styles.themePill, theme.align === a && styles.themePillActive]}>
                        <Text style={[styles.themePillText, theme.align === a && styles.themePillTextActive]}>{a}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* VISUAL RESUME LAYOUT */}
              {Platform.OS === 'web' ? (
                <iframe
                  srcDoc={generateATSResumeHTML(finalResume, showPhoto, theme)}
                  style={{ width: '100%', height: 1150, borderWidth: 0, backgroundColor: 'transparent', borderRadius: 8 }}
                  title="PDF Preview"
                />
              ) : (
                <View style={styles.resumePreview}>
                
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

                {/* 5. Summary */}
                {finalResume.summary ? (
                  <>
                    <Text style={styles.resumeSectionTitle}>Summary</Text>
                    {renderNativeContent(finalResume.summary, finalResume.summaryLink)}
                  </>
                ) : null}

                {/* 6. Education */}
                {finalResume.education && finalResume.education.length > 0 ? (
                  <>
                    <Text style={styles.resumeSectionTitle}>Education</Text>
                    {finalResume.education.map((ed, idx) => (
                      <View key={idx} style={styles.resumeItemBlock}>
                        <View style={styles.resumeItemHeader}>
                          {ed.institutionLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(ed.institutionLink)}>
                              <Text style={[styles.resumeItemTitle, styles.linkableText]}>{ed.institution}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeItemTitle}>{ed.institution}</Text>
                          )}
                          
                          {ed.durationLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(ed.durationLink)}>
                              <Text style={[styles.resumeItemDate, styles.linkableText]}>{ed.duration}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeItemDate}>{ed.duration}</Text>
                          )}
                        </View>
                        
                        {ed.courseLink ? (
                          <TouchableOpacity onPress={() => Linking.openURL(ed.courseLink)}>
                            <Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{ed.course}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.resumeItemSubtitle}>{ed.course}</Text>
                        )}
                        
                        {ed.score ? (
                          ed.scoreLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(ed.scoreLink)}>
                              <Text style={[styles.resumeText, styles.linkableText]}>Score: {ed.score}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeText}>Score: {ed.score}</Text>
                          )
                        ) : null}
                      </View>
                    ))}
                  </>
                ) : null}

                {/* Work Experience */}
                {finalResume.experience && finalResume.experience.length > 0 ? (
                  <>
                    <Text style={styles.resumeSectionTitle}>Work Experience</Text>
                    {finalResume.experience.map((exp, idx) => (
                      <View key={idx} style={styles.resumeItemBlock}>
                        <View style={styles.resumeItemHeader}>
                          {exp.companyLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(exp.companyLink)}>
                              <Text style={[styles.resumeItemTitle, styles.linkableText]}>{exp.company}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeItemTitle}>{exp.company}</Text>
                          )}
                          
                          {exp.durationLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(exp.durationLink)}>
                              <Text style={[styles.resumeItemDate, styles.linkableText]}>{exp.duration}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeItemDate}>{exp.duration}</Text>
                          )}
                        </View>
                        
                        {exp.roleLink ? (
                          <TouchableOpacity onPress={() => Linking.openURL(exp.roleLink)}>
                            <Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{exp.role}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.resumeItemSubtitle}>{exp.role}</Text>
                        )}
                        
                        {renderNativeContent(exp.summary, exp.summaryLink)}
                      </View>
                    ))}
                  </>
                ) : null}

                {/* 7. Skills */}
                {finalResume.skills ? (
                  <>
                    <Text style={styles.resumeSectionTitle}>Skills</Text>
                    {finalResume.skillsLink ? (
                      <TouchableOpacity onPress={() => Linking.openURL(finalResume.skillsLink)}>
                        <Text style={[styles.resumeText, styles.linkableText]}>{finalResume.skills}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.resumeText}>{finalResume.skills}</Text>
                    )}
                  </>
                ) : null}

                {/* 8. Projects */}
                {finalResume.projects && finalResume.projects.length > 0 ? (
                  <>
                    <Text style={styles.resumeSectionTitle}>Projects</Text>
                    {finalResume.projects.map((proj, idx) => {
                      // Extract top 2 links based on priority
                      const topLinks = [
                        proj.demoLink && { url: proj.demoLink, label: 'Live Demo' },
                        proj.docLink && { url: proj.docLink, label: 'Docs' },
                        proj.videoLink && { url: proj.videoLink, label: 'Video' },
                        proj.gitLink && { url: proj.gitLink, label: 'GitHub' }
                      ].filter(Boolean).slice(0, 2);
                      
                      return (
                        <View key={idx} style={styles.resumeItemBlock}>
                          <View style={styles.resumeItemHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', flex: 1 }}>
                              {proj.nameLink ? (
                                <TouchableOpacity onPress={() => Linking.openURL(proj.nameLink)}>
                                  <Text style={[styles.resumeItemTitle, styles.linkableText]}>{proj.name}</Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={styles.resumeItemTitle}>{proj.name}</Text>
                              )}
                              {topLinks.map((link, i) => (
                                <TouchableOpacity key={i} onPress={() => Linking.openURL(link.url)}>
                                  <Text style={[styles.projectLinkItem, { marginLeft: 8, fontSize: 11 }]}>[{link.label}]</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          
                          {proj.roleLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(proj.roleLink)}>
                              <Text style={[styles.resumeItemDate, styles.linkableText]}>{proj.role}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeItemDate}>{proj.role}</Text>
                          )}
                        </View>
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
                          {proj.typeLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(proj.typeLink)}>
                              <Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{proj.type}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeItemSubtitle}>{proj.type}</Text>
                          )}
                          <Text style={styles.resumeItemSubtitle}> | </Text>
                          {proj.techStackLink ? (
                            <TouchableOpacity onPress={() => Linking.openURL(proj.techStackLink)}>
                              <Text style={[styles.resumeItemSubtitle, styles.linkableText]}>{proj.techStack}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.resumeItemSubtitle}>{proj.techStack}</Text>
                          )}
                        </View>

                        {proj.summaryLink ? (
                          <TouchableOpacity onPress={() => Linking.openURL(proj.summaryLink)}>
                            <Text style={[styles.resumeText, styles.linkableText]}>{proj.summary}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.resumeText}>{proj.summary}</Text>
                        )}
                        
                      </View>
                    )})}
                  </>
                ) : null}

                {/* 9. Achievements */}
                {finalResume.achievements && finalResume.achievements.length > 0 ? (
                  <>
                    <Text style={styles.resumeSectionTitle}>Accomplishments</Text>
                    {finalResume.achievements.map((ach, idx) => (
                      <View key={idx} style={styles.resumeItemBlock}>
                        {ach.link ? (
                          <TouchableOpacity onPress={() => Linking.openURL(ach.link)}>
                            <Text style={[styles.resumeText, styles.linkableText]}>• {ach.text}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.resumeText}>• {ach.text}</Text>
                        )}
                      </View>
                    ))}
                  </>
                ) : null}
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
  
  themeToolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, backgroundColor: '#0F172A', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  themeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeLabel: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold' },
  themePill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  themePillActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  themePillText: { color: '#94A3B8', fontSize: 12 },
  themePillTextActive: { color: '#fff', fontWeight: 'bold' },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff' },

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
  modalMessage: { color: '#94A3B8', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 12 },
  modalCancelText: { color: '#94A3B8', fontWeight: '600' },
  modalConfirmBtn: { backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' }
})