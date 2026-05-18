import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch, Image, Linking, Platform, Modal, PanResponder, useWindowDimensions } from 'react-native'
import { doc, getDoc, setDoc, collection, addDoc, deleteField } from 'firebase/firestore'
import { Feather } from '@expo/vector-icons'
import { db } from '../firebaseConfig'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'

import { loadLibraries, getHtml2Pdf, getPdfjsLib, getPdfLib } from '../pdfHelpers';
import { getBuilderStyles, getDynamicStyles } from '../styles';

// --- ATS-OPTIMIZED HTML GENERATOR ---
const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

const generateATSResumeHTML = (resume, showPhoto, theme) => {
  const { personal, summary, summaryLink, education, experience, skills, skillsLink, projects, achievements } = resume;
  const fontScale = theme?.fontSizeScale || 1;
  const lhScale = theme?.lineSpacingScale || 1;

  const alignStyle = showPhoto && personal?.photoURL ? 'left' : 'center';

  const makeLink = (text, url) => url ? `<a href="${ensureAbsoluteUrl(url)}" target="_blank">${text}</a>` : text;
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
        @page { size: A4; margin: 0; }
        body { font-family: 'Arial', Helvetica, sans-serif; color: #000; font-size: ${9.5 * fontScale}pt; line-height: ${1.2 * lhScale}; margin: 0; padding: 5mm; background: #e2e8f0; }
        
        /* Simulated A4 Paper for Web Preview */
        .a4-container { background: #fff; width: 210mm; max-width: 100%; min-height: 297mm; margin: 20px auto; padding: 8mm; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.15); overflow: hidden; }
        
        /* Remove simulation styles when actually printing to PDF */
        @media print { body { background: #fff; padding: 0; } .a4-container { width: 100%; min-height: auto; margin: 0; padding: 8mm; box-shadow: none; overflow: visible !important; } }

        /* ATS-Friendly Typography & Structure */
        * { box-sizing: border-box; }
        a { color: #2563EB; text-decoration: underline; }
        h1 { font-size: ${18 * fontScale}pt; font-weight: bold; text-align: ${alignStyle}; margin: 0 0 4px 0; text-transform: uppercase; color: #000000; line-height: ${1.05 * lhScale}; }
        h2 { font-size: ${10.5 * fontScale}pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000000; margin: 5px 0 3px 0; padding-bottom: 1px; color: #000000; line-height: ${1.1 * lhScale}; break-after: avoid; }
        
        .contact-info { text-align: ${alignStyle}; font-size: ${8.5 * fontScale}pt; margin-bottom: 3px; }
        .links-bar { text-align: ${alignStyle}; font-size: ${8.5 * fontScale}pt; margin-bottom: 8px; }
        .links-bar a { margin: 0 4px; }
        
        .section-content { text-align: left; }
        .item-block { margin-bottom: 4px; break-inside: avoid; }
        
        .item-header { clear: both; overflow: hidden; margin-bottom: 1px; }
        .item-title { font-weight: bold; float: left; color: #000000; }
        .item-date { float: right; }
        .item-subtitle { font-style: italic; clear: both; }
        
        .item-tech { font-size: ${8.5 * fontScale}pt; font-weight: bold; margin-bottom: 2px; }
        .item-desc { font-size: ${9.25 * fontScale}pt; margin-top: 2px; }
        
        ul { margin: 2px 0 0 14px; padding: 0; }
        li { margin-bottom: 2px; }
        p, div, span { orphans: 3; widows: 3; }
      </style>
    </head>
    <body>
      <div class="a4-container">

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
        <tr>
          <td style="vertical-align: top; text-align: ${alignStyle}; padding: 0;">
            <!-- 1. Name -->
            <h1>${makeLink(personal?.name || 'Your Name', personal?.nameLink)}</h1>

            <!-- 3. Contact Details -->
            <div class="contact-info">
              ${makeLink(personal?.phone || '', personal?.phoneLink)} 
              ${personal?.phone && personal?.email ? ' | ' : ''} 
              ${personal?.email ? `<a href="mailto:${personal.email}">${personal.email}</a>` : ''}
            </div>

            <!-- 4. Links -->
            <div class="links-bar">
              ${personal?.portfolio ? `<a href="${ensureAbsoluteUrl(personal.portfolio)}">Portfolio</a>` : ''}
              ${personal?.linkedin ? `<a href="${ensureAbsoluteUrl(personal.linkedin)}">LinkedIn</a>` : ''}
              ${personal?.github ? `<a href="${ensureAbsoluteUrl(personal.github)}">GitHub</a>` : ''}
              ${personal?.leetcode ? `<a href="${ensureAbsoluteUrl(personal.leetcode)}">LeetCode</a>` : ''}
            </div>
          </td>
          ${showPhoto && personal?.photoURL ? `
          <td style="width: 80px; vertical-align: top; text-align: right; padding: 0;">
            <img src="${personal.photoURL}" alt="Profile Photo" style="width: 70px; height: 70px; object-fit: cover;" />
          </td>
          ` : ''}
        </tr>
      </table>

      ${(() => {
        const sectionsHTML = {
          summary: summary ? `\n        <h2>Professional Summary</h2>\n        <div class="section-content">\n          ${formatContent(summary, summaryLink)}\n        </div>\n      ` : '',
          education: education && education.length > 0 ? `\n        <h2>Education</h2>\n        <div class="section-content">\n          ${education.map(ed => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(ed.institution, ed.institutionLink)}</span>\n                <span class="item-date">${makeLink(ed.duration, ed.durationLink)}</span>\n              </div>\n              <div class="item-subtitle">${makeLink(ed.course, ed.courseLink)}</div>\n              ${ed.score ? `<div>${getScoreLabel(ed.score)}: ${makeLink(ed.score, ed.scoreLink)}</div>` : ''}\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          experience: experience && experience.length > 0 ? `\n        <h2>Work Experience</h2>\n        <div class="section-content">\n          ${experience.map(exp => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(exp.company, exp.companyLink)}${exp.role ? ` | <span style="font-weight:normal">${makeLink(exp.role, exp.roleLink)}</span>` : ''}</span>\n                <span class="item-date">${makeLink(exp.duration, exp.durationLink)}</span>\n              </div>\n              <div class="item-desc">${formatContent(exp.summary, exp.summaryLink, theme.experienceBullets ?? false)}</div>\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          skills: skills ? `\n        <h2>Skills</h2>\n        <div class="section-content">\n          ${makeLink(typeof skills === 'string' ? skills.split('\n').map(line => { const i = line.indexOf(':'); return i !== -1 ? '<strong>' + line.substring(0, i + 1) + '</strong>' + line.substring(i + 1) : line; }).join('<br>') : skills, skillsLink)}\n        </div>\n      ` : '',
          projects: projects && projects.length > 0 ? `\n        <h2>Projects</h2>\n        <div class="section-content">\n          ${projects.map(proj => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(proj.name, proj.nameLink)}${[proj.demoLink && `<a href="${ensureAbsoluteUrl(proj.demoLink)}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#2563EB; text-decoration:underline;">[Live Demo]</a>`, proj.docLink && `<a href="${ensureAbsoluteUrl(proj.docLink)}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#2563EB; text-decoration:underline;">[Docs]</a>`, proj.videoLink && `<a href="${ensureAbsoluteUrl(proj.videoLink)}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#2563EB; text-decoration:underline;">[Video]</a>`, proj.gitLink && `<a href="${ensureAbsoluteUrl(proj.gitLink)}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:#2563EB; text-decoration:underline;">[GitHub]</a>`].filter(Boolean).slice(0, 2).join('')}${proj.role ? ` | <span style="font-weight:normal">${makeLink(proj.role, proj.roleLink)}</span>` : ''}</span>\n              </div>\n              <div class="item-tech">${makeLink(proj.type, proj.typeLink)} | ${makeLink(proj.techStack, proj.techStackLink)}</div>\n              <div class="item-desc">${formatContent(proj.summary, proj.summaryLink, theme.projectsBullets ?? true)}</div>\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          achievements: achievements && achievements.length > 0 ? `\n        <h2>Accomplishments</h2>\n        <div class="section-content">\n          <ul>\n            ${achievements.map(ach => `<li>${makeLink(ach.text, ach.link)}</li>`).join('')}\n          </ul>\n        </div>\n      ` : ''
        };
        
        return (theme.sectionOrder || ['summary', 'education', 'experience', 'skills', 'projects', 'achievements']).map(sec => sectionsHTML[sec]).join('');
      })()}

      </div>
    </body>
    </html>
  `;
}

const Stepper = ({ icon, value, min, max, step, onValueChange, appTheme }) => {
  const handleDecrease = () => onValueChange(Math.max(min, value - step));
  const handleIncrease = () => onValueChange(Math.min(max, value + step));
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderRadius: 20, borderWidth: 1, borderColor: appTheme.border, paddingHorizontal: 4, paddingVertical: 2 }}>
      <Feather name={icon} size={14} color={appTheme.textMuted} style={{ marginRight: 2, marginLeft: 2 }} />
      <TouchableOpacity onPress={handleDecrease} style={{ padding: 4 }}>
        <Feather name="minus" size={14} color={value <= min ? appTheme.border : appTheme.text} />
      </TouchableOpacity>
      <Text style={{ color: appTheme.text, fontSize: 12, fontFamily: 'Talina', width: 28, textAlign: 'center' }}>{value.toFixed(2)}</Text>
      <TouchableOpacity onPress={handleIncrease} style={{ padding: 4 }}>
        <Feather name="plus" size={14} color={value >= max ? appTheme.border : appTheme.text} />
      </TouchableOpacity>
    </View>
  );
};

export default function BuilderScreen({ user, onGoBack, appTheme }) {
  const defaultSectionOrder = ['summary', 'education', 'experience', 'skills', 'projects', 'achievements'];
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalResume, setFinalResume] = useState(null)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [progress, setProgress] = useState(0)
  const [showPhoto, setShowPhoto] = useState(false)
  const [clearModalVisible, setClearModalVisible] = useState(false)
  const [saveModalVisible, setSaveModalVisible] = useState(false)
  const [theme, setTheme] = useState({ sectionOrder: defaultSectionOrder, projectsBullets: true, experienceBullets: false, fontSizeScale: 1, lineSpacingScale: 1 })
  const [popupState, setPopupState] = useState({ visible: false, title: '', message: '', isError: false })
  const [promptHistory, setPromptHistory] = useState([])
  const progressInterval = useRef(null)
  const { width: windowWidth } = useWindowDimensions()
  
  const dStyles = React.useMemo(() => getDynamicStyles(theme), [theme.fontSizeScale, theme.lineSpacingScale]);
  const styles = getBuilderStyles(appTheme);

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
          if (data.theme) setTheme(prev => ({ ...prev, ...data.theme }))
        }
      } catch (error) {
        console.error("Error loading tailored resume:", error)
      }
    }
    loadTailoredResume()
  }, [user.uid])

  // Auto-save theme changes (sliders, bullet toggles, section order)
  useEffect(() => {
    if (finalResume) {
      const timeoutId = setTimeout(() => {
        setDoc(doc(db, 'resumes', user.uid), { theme }, { merge: true }).catch(error => console.error("Error saving theme:", error));
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [theme, finalResume, user.uid]);

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
        7. ANTI-HALLUCINATION: Do NOT hallucinate, invent, or fabricate any experience, projects, education, skills, or metrics that are not explicitly present in the Base Resume. If the requested data or skill for the job description is not available in the Base Resume, do NOT make it up. Stick strictly to the provided facts.
        8. Return ONLY a valid JSON object matching this exact structure: { "roleName": "Extracted Job Title", "summary": "...", "skills": ["..."], "projects": [{ "name": "...", "nameLink": "...", "type": "...", "typeLink": "...", "role": "...", "roleLink": "...", "gitLink": "...", "docLink": "...", "videoLink": "...", "demoLink": "...", "techStack": "...", "techStackLink": "...", "summary": "...", "summaryLink": "..." }] }. Preserve any existing link values from the base resume. Do not include markdown formatting like \`\`\`json.

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
        // Lower temperature prevents the AI from being "creative" and inventing things
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
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
        // Copy non-tailored fields from base
        personal: baseResume.personal,
        education: baseResume.education,
        experience: baseResume.experience,
        achievements: baseResume.achievements,
        // Also copy over the link fields for summary and skills from base
        summaryLink: baseResume.summaryLink,
        skillsLink: baseResume.skillsLink,
        // Add AI-generated fields
        baseSkills: baseResume.skills, // Explicitly save original skills
        roleName: aiResult.roleName || 'Tailored Resume',
        summary: aiResult.summary || baseResume.summary || '',
        skills: Array.isArray(aiResult.skills) ? aiResult.skills.join('\n') : (aiResult.skills || ''),
        projects: Array.isArray(aiResult.projects) ? aiResult.projects : [],
      }

      // Save the generated resume to Firestore
      await setDoc(doc(db, 'resumes', user.uid), JSON.parse(JSON.stringify({ tailoredResume, promptHistory: [] })), { merge: true })
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
      setPopupState({ visible: true, title: 'Missing Info', message: 'Please enter your requested changes.', isError: true })
      return
    }

    setLoading(true)
    startProgress()
    try {
      // Fetch base resume to give AI complete context of the user's actual facts
      const docSnap = await getDoc(doc(db, 'resumes', user.uid));
      const baseResume = docSnap.exists() ? docSnap.data() : {};

      const prompt = `
        You are an expert technical recruiter, resume writer, and designer.
        
        Here is the user's COMPLETE Base Resume (containing all their raw facts, projects, and experiences). You may draw from this if the user asks to add something they have done:
        ${JSON.stringify({
          summary: baseResume.summary || '',
          skills: baseResume.skills || '',
          education: baseResume.education || [],
          experience: baseResume.experience || [],
          achievements: baseResume.achievements || [],
          projects: baseResume.projects || []
        })}

        Here is the CURRENT draft of the tailored resume that we are editing:
        ${JSON.stringify(finalResume)}
        
        Here is the current styling theme:
        ${JSON.stringify(theme)}

        ${promptHistory.length > 0 ? `Previous change requests in this session (for context):\n${promptHistory.map((p, i) => `${i + 1}. "${p}"`).join('\n')}\n` : ''}
        The user has requested the following NEW changes to their resume or styling:
        "${refinePrompt}"

        IMPORTANT: For any changes to the 'skills' field, you must categorize skills into the following topics: "Languages", "Web Development", "Backend", "Database", "Frameworks", "Tools".
        The skills you list MUST come from the user's base skills, which are: "${baseResume.skills || ''}". Do not invent skills.
        If a relevant skill from the user's base skills does not fit into any of the predefined topics, you are allowed to create a new, appropriate topic for it.

        ANTI-HALLUCINATION: Do NOT hallucinate, invent, or fabricate any new experiences, projects, skills, or metrics. If the user requests to add information or a skill that is completely absent from their Base Resume context, do NOT add it to the resume data. Instead, reject the addition and provide feedback explaining why in the 'infoMessage' string.

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
          // Lower temperature strictly enforces facts over creativity
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
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
      await setDoc(doc(db, 'resumes', user.uid), JSON.parse(JSON.stringify({ tailoredResume: refinedResume, promptHistory: newPromptHistory })), { merge: true })
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
      await setDoc(doc(db, 'resumes', user.uid), { tailoredResume: deleteField(), promptHistory: deleteField(), theme: deleteField() }, { merge: true })
      setFinalResume(null)
      setPromptHistory([])
      setJd('')
      setRefinePrompt('')
      setTheme({ sectionOrder: defaultSectionOrder, projectsBullets: true, experienceBullets: false, fontSizeScale: 1, lineSpacingScale: 1 })
    } catch (error) {
      console.error("Clear Error:", error)
      setPopupState({ visible: true, title: 'Error', message: 'Failed to clear resume.', isError: true })
    } finally {
      setLoading(false)
    }
  }

  const executeSave = async () => {
    setSaveModalVisible(false);
    setLoading(true);
    const extractedRole = finalResume?.roleName || 'Tailored Resume';
    try {
      const payload = JSON.parse(JSON.stringify({
        userId: user.uid,
        roleName: extractedRole,
        resumeData: finalResume,
        theme: theme || {},
        createdAt: new Date().toISOString()
      }));
      await addDoc(collection(db, 'userResumes'), payload);
      setPopupState({ visible: true, title: 'Success', message: 'Resume saved under ' + extractedRole + '!', isError: false });
    } catch (error) {
      console.error("Save Error:", error);
      setPopupState({ visible: true, title: 'Error', message: 'Failed to save resume. ' + error.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  const handleExportPDF = async () => {
    try {
      console.log('handleExportPDF called');

      // Load libraries if not already loaded
      if (!getHtml2Pdf() || !getPdfjsLib()) {
        console.log('Loading libraries...');
        await loadLibraries();
      }

      const html2pdf = getHtml2Pdf();
      const pdfjsLib = getPdfjsLib();

      const htmlContent = generateATSResumeHTML(finalResume, showPhoto, theme);
      console.log('HTML content generated, length:', htmlContent.length);
      
      if (Platform.OS === 'web') {
        const printContainer = document.createElement('div');
        printContainer.id = 'print-overlay-container';
        printContainer.style.position = 'fixed';
        printContainer.style.top = '0';
        printContainer.style.left = '0';
        printContainer.style.width = '100vw';
        printContainer.style.height = '100vh';
        printContainer.style.backgroundColor = appTheme.bg;
        printContainer.style.zIndex = '99999';
        printContainer.style.display = 'flex';
        printContainer.style.flexDirection = 'column';

        const topBar = document.createElement('div');
        topBar.style.display = 'flex';
        topBar.style.justifyContent = 'space-between';
        topBar.style.alignItems = 'center';
        topBar.style.padding = '16px 24px';
        topBar.style.backgroundColor = 'transparent';
        topBar.style.color = appTheme.text;
        topBar.style.boxShadow = 'none';

        const title = document.createElement('h2');
        title.innerText = 'PDF';
        title.style.margin = '0';
        title.style.fontSize = '30px';
        title.style.fontWeight = '300';
        title.style.letterSpacing = '1px';
        title.style.fontFamily = 'Talina';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';

        const downloadBtn = document.createElement('button');
        downloadBtn.innerText = '⬇ Download PDF';
        downloadBtn.style.padding = '8px 14px';
        downloadBtn.style.backgroundColor = appTheme.primary;
        downloadBtn.style.color = appTheme.primaryText;
        downloadBtn.style.border = 'none';
        downloadBtn.style.borderRadius = '8px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.fontWeight = '500';
        downloadBtn.style.fontFamily = 'Talina';
        downloadBtn.style.letterSpacing = '0.5px';

        const backBtn = document.createElement('button');
        backBtn.innerText = '← Back';
        backBtn.style.padding = '6px 12px';
        backBtn.style.backgroundColor = appTheme.surface;
        backBtn.style.color = appTheme.text;
        backBtn.style.border = `1px solid ${appTheme.border}`;
        backBtn.style.borderRadius = '8px';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontWeight = '400';
        backBtn.style.fontFamily = 'Talina';
        backBtn.style.letterSpacing = '0.5px';

        buttonContainer.appendChild(downloadBtn);

        topBar.appendChild(backBtn);
        title.style.flex = '1';
        title.style.textAlign = 'center';
        topBar.appendChild(title);
        topBar.appendChild(buttonContainer);

        const previewContainer = document.createElement('div');
        previewContainer.id = 'pdf-preview-container';
        previewContainer.style.flex = '1';
        previewContainer.style.overflow = 'auto';
        previewContainer.style.padding = '20px';
        previewContainer.style.backgroundColor = appTheme.bg;
        previewContainer.style.display = 'flex';
        previewContainer.style.flexDirection = 'column';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.gap = '20px';

        const loadingText = document.createElement('div');
        loadingText.innerText = 'Generating PDF preview...';
        loadingText.style.fontSize = '16px';
        loadingText.style.color = appTheme.textMuted;
        loadingText.style.fontFamily = 'Talina';
        previewContainer.appendChild(loadingText);

        printContainer.appendChild(topBar);
        printContainer.appendChild(previewContainer);
        document.body.appendChild(printContainer);

        // Create hidden element for PDF generation
        const hiddenElement = document.createElement('div');
        hiddenElement.innerHTML = htmlContent;
        hiddenElement.style.position = 'fixed';
        hiddenElement.style.left = '0px';
        hiddenElement.style.top = '0px';
        hiddenElement.style.width = '210mm';
        hiddenElement.style.zIndex = '-1000';
        hiddenElement.id = 'hidden-resume-content';
        document.body.appendChild(hiddenElement);

        // Allow DOM to render and styles to apply before capturing
        await new Promise(resolve => setTimeout(resolve, 300));

        // Generate PDF preview
        const element = hiddenElement.querySelector('.a4-container') || hiddenElement;
        const userName = finalResume.personal?.name ? finalResume.personal.name.replace(/\s+/g, '-') : 'Resume';
        const opt = {
          margin: 0,
          filename: `${userName}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
          console.log('Starting PDF generation...');
          console.log('html2pdf available:', typeof html2pdf);
          console.log('pdfjsLib available:', typeof pdfjsLib);

          if (!html2pdf) {
            throw new Error('html2pdf.js library failed to load');
          }
          if (!pdfjsLib) {
            throw new Error('pdfjs-dist library failed to load');
          }

          const pdf = await html2pdf().set(opt).from(element).outputPdf('blob');
          console.log('PDF generated successfully, size:', pdf.size);

          // Clean up hidden element immediately to prevent style leakage
          if (document.body.contains(hiddenElement)) {
            document.body.removeChild(hiddenElement);
          }

          const pdfUrl = URL.createObjectURL(pdf);
          console.log('PDF URL created:', pdfUrl);

          // Load PDF pages as images for preview
          const loadingTask = pdfjsLib.getDocument(pdfUrl);
          const pdfDoc = await loadingTask.promise;
          const numPages = pdfDoc.numPages;
          console.log('PDF loaded with', numPages, 'pages');

          // Clear loading text
          previewContainer.innerHTML = '';

          let currentPage = 1;
          const deletedPages = new Set();

          const bottomControls = document.createElement('div');
          bottomControls.style.display = 'flex';
          bottomControls.style.flexDirection = 'column';
          bottomControls.style.alignItems = 'center';
          bottomControls.style.gap = '16px';
          bottomControls.style.paddingBottom = '32px';
          previewContainer.appendChild(bottomControls);

          const updateDeleteBtnState = () => {
            if (deletedPages.has(currentPage)) {
              deleteBtn.innerText = 'Restore Current Page';
              deleteBtn.style.backgroundColor = appTheme.textMuted;
            } else {
              deleteBtn.innerText = 'Delete Current Page';
              deleteBtn.style.backgroundColor = appTheme.error;
            }
            // Disable if it's the last remaining page to avoid an empty PDF
            if (!deletedPages.has(currentPage) && deletedPages.size === numPages - 1) {
              deleteBtn.disabled = true;
              deleteBtn.style.opacity = '0.5';
              deleteBtn.title = "Cannot delete the only remaining page";
            } else {
              deleteBtn.disabled = false;
              deleteBtn.style.opacity = '1';
              deleteBtn.title = "";
            }
          };

          const deleteBtn = document.createElement('button');
          deleteBtn.style.padding = '6px 12px';
          deleteBtn.style.color = '#fff';
          deleteBtn.style.border = 'none';
          deleteBtn.style.borderRadius = '8px';
          deleteBtn.style.cursor = 'pointer';
          deleteBtn.style.fontWeight = '500';
          deleteBtn.style.fontFamily = 'Talina';
          deleteBtn.style.letterSpacing = '0.5px';
          deleteBtn.style.display = numPages > 1 ? 'block' : 'none'; // Only relevant for multi-page

          deleteBtn.onclick = () => {
            if (deletedPages.has(currentPage)) {
              deletedPages.delete(currentPage);
            } else {
              deletedPages.add(currentPage);
            }
            updateDeleteBtnState();
            
            // Add visual indication to the canvas
            const canvas = previewContainer.querySelector('canvas');
            if (canvas) {
              if (deletedPages.has(currentPage)) {
                canvas.style.opacity = '0.4';
                canvas.style.filter = 'grayscale(100%)';
              } else {
                canvas.style.opacity = '1';
                canvas.style.filter = 'none';
              }
            }
          };

          bottomControls.appendChild(deleteBtn);
          updateDeleteBtnState();

          const renderPage = async (pageNum) => {
            const page = await pdfDoc.getPage(pageNum);
            const scale = 1.5;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            canvas.style.border = '1px solid #e5e7eb';
            canvas.style.transition = 'all 0.3s ease';

            if (deletedPages.has(pageNum)) {
              canvas.style.opacity = '0.4';
              canvas.style.filter = 'grayscale(100%)';
            }

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };

            await page.render(renderContext).promise;

            // Clear previous page
            const existingCanvas = previewContainer.querySelector('canvas');
            if (existingCanvas) {
              previewContainer.removeChild(existingCanvas);
            }

            previewContainer.insertBefore(canvas, bottomControls);
            updateDeleteBtnState();
          };

          // Create page navigation if multiple pages
          if (numPages > 1) {
            const navContainer = document.createElement('div');
            navContainer.style.display = 'flex';
            navContainer.style.justifyContent = 'center';
            navContainer.style.marginBottom = '10px';
            navContainer.style.gap = '10px';

            const prevBtn = document.createElement('button');
            prevBtn.innerText = '← Previous';
            prevBtn.style.padding = '6px 12px';
            prevBtn.style.backgroundColor = appTheme.surface;
            prevBtn.style.color = appTheme.text;
            prevBtn.style.border = `1px solid ${appTheme.border}`;
            prevBtn.style.borderRadius = '6px';
            prevBtn.style.cursor = 'pointer';
            prevBtn.style.fontFamily = 'Talina';
            prevBtn.style.letterSpacing = '0.5px';
            prevBtn.disabled = true;

            const pageInfo = document.createElement('span');
            pageInfo.innerText = `Page 1 of ${numPages}`;
            pageInfo.style.fontSize = '14px';
            pageInfo.style.fontWeight = '400';
            pageInfo.style.color = appTheme.text;
            pageInfo.style.fontFamily = 'Talina';

            const nextBtn = document.createElement('button');
            nextBtn.innerText = 'Next →';
            nextBtn.style.padding = '6px 12px';
            nextBtn.style.backgroundColor = appTheme.surface;
            nextBtn.style.color = appTheme.text;
            nextBtn.style.border = `1px solid ${appTheme.border}`;
            nextBtn.style.borderRadius = '6px';
            nextBtn.style.cursor = 'pointer';
            nextBtn.style.fontFamily = 'Talina';
            nextBtn.style.letterSpacing = '0.5px';

            navContainer.appendChild(prevBtn);
            navContainer.appendChild(pageInfo);
            navContainer.appendChild(nextBtn);
            bottomControls.appendChild(navContainer);

            prevBtn.onclick = () => {
              if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
                pageInfo.innerText = `Page ${currentPage} of ${numPages}`;
                prevBtn.disabled = currentPage === 1;
                nextBtn.disabled = currentPage === numPages;
              }
            };

            nextBtn.onclick = () => {
              if (currentPage < numPages) {
                currentPage++;
                renderPage(currentPage);
                pageInfo.innerText = `Page ${currentPage} of ${numPages}`;
                prevBtn.disabled = currentPage === 1;
                nextBtn.disabled = currentPage === numPages;
              }
            };
          }

          // Render first page
          await renderPage(1);

          // Download functionality
          downloadBtn.onclick = async () => {
            try {
              let finalBlob = pdf;

              if (deletedPages.size > 0) {
                downloadBtn.innerText = 'Processing...';
                downloadBtn.disabled = true;

                let PDFDocumentLib;
                try {
                  const pdfLibModule = await getPdfLib();
                  PDFDocumentLib = pdfLibModule.PDFDocument;
                } catch (e) {
                  // Fallback to CDN if not natively installed
                  if (!window.PDFLib) {
                    await new Promise((resolve, reject) => {
                      const script = document.createElement('script');
                      script.src = 'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js';
                      script.onload = () => resolve();
                      script.onerror = reject;
                      document.head.appendChild(script);
                    });
                  }
                  PDFDocumentLib = window.PDFLib.PDFDocument;
                }

                if (PDFDocumentLib) {
                  const arrayBuffer = await finalBlob.arrayBuffer();
                  const pdfDocObj = await PDFDocumentLib.load(arrayBuffer);
                  
                  // Remove pages in reverse order to maintain correct indices
                  const pagesToRemove = Array.from(deletedPages).sort((a, b) => b - a);
                  for (const pageNum of pagesToRemove) {
                    pdfDocObj.removePage(pageNum - 1); // 0-indexed
                  }
                  
                  const pdfBytes = await pdfDocObj.save();
                  finalBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                } else {
                  console.warn("Could not load pdf-lib, downloading original PDF.");
                }

                downloadBtn.innerText = '⬇ Download PDF';
                downloadBtn.disabled = false;
              }

              const link = document.createElement('a');
              link.href = URL.createObjectURL(finalBlob);
              link.download = `${userName}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(link.href);
            } catch (err) {
              console.error("PDF Download Error:", err);
              alert('Failed to download PDF');
              downloadBtn.innerText = '⬇ Download PDF';
              downloadBtn.disabled = false;
            }
          };

        } catch (err) {
          if (document.body.contains(hiddenElement)) {
            document.body.removeChild(hiddenElement);
          }
          console.error("PDF Preview Error:", err);
          console.error("Error details:", err.message, err.stack);

          // Show error message in preview
          previewContainer.innerHTML = `
            <div style="color: #ef4444; text-align: center; padding: 40px; max-width: 500px;">
              <h3 style="margin: 0 0 16px 0; color: #ef4444; font-family: 'Gondens'; font-weight: 300; transform: translateY(-10px);">FAILED TO GENERATE PDF PREVIEW</h3>
              <p style="margin: 0 0 16px 0; color: ${appTheme.textMuted}; font-family: 'Talina';">${err.message || 'Unknown error occurred'}</p>
              <p style="margin: 0; color: ${appTheme.textMuted}; font-size: 14px; font-family: 'Talina';">Check the browser console for more details.</p>
              <div style="margin-top: 20px;">
                <button onclick="location.reload()" style="margin-right: 10px; padding: 8px 16px; background: ${appTheme.primary}; color: ${appTheme.primaryText}; border: none; border-radius: 6px; cursor: pointer; font-family: 'Talina'; letter-spacing: 0.5px;">Retry</button>
                <button id="show-html-fallback" style="padding: 8px 16px; background: ${appTheme.surface}; color: ${appTheme.text}; border: 1px solid ${appTheme.border}; border-radius: 6px; cursor: pointer; font-family: 'Talina'; letter-spacing: 0.5px;">Show HTML Preview</button>
              </div>
            </div>
          `;

          // Add fallback HTML preview button functionality
          setTimeout(() => {
            const fallbackBtn = document.getElementById('show-html-fallback');
            if (fallbackBtn) {
              fallbackBtn.onclick = () => {
                previewContainer.innerHTML = `
                  <div style="width: 100%; max-width: 800px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <div style="margin-bottom: 20px; text-align: center; color: #64748b; font-size: 14px; font-family: 'Talina';">
                      HTML Preview (PDF generation failed)
                    </div>
                    <div style="transform: scale(0.8); transform-origin: top center;">
                      ${htmlContent}
                    </div>
                  </div>
                `;
              };
            }
          }, 100);
        }

        backBtn.onclick = () => {
          document.body.removeChild(printContainer);
        };
      } else {
        // On Native (iOS/Android), open the native system PDF preview overlay
        await Print.printAsync({ html: htmlContent });
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      setPopupState({ visible: true, title: 'Export Error', message: 'Failed to generate PDF.', isError: true });
    }
  }

  const getScoreLabel = (score) => String(score).includes('.') ? 'CGPA' : 'Percentage'

  const renderNativeContent = (text, link, bulletOnMultiple = false, dStyles = {}) => {
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
              <Text style={[styles.resumeText, dStyles.resumeText]}>• </Text>
              {link ? (
                <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(link))} style={{ flex: 1 }}>
                  <Text style={[styles.resumeText, styles.linkableText, dStyles.resumeText]}>{p}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.resumeText, dStyles.resumeText, { flex: 1 }]}>{p}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    
    return link ? (
      <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(link))}>
        <Text style={[styles.resumeText, styles.linkableText, dStyles.resumeText, { marginTop: 4 }]}>{text}</Text>
      </TouchableOpacity>
    ) : (
      <Text style={[styles.resumeText, dStyles.resumeText, { marginTop: 4 }]}>{text}</Text>
    );
  };

  const renderWebPreviewText = (text, bulletOnMultiple = false, dStyles = {}) => {
    if (!text) return null
    let points = text.split(/\n/).map(p => p.trim()).filter(Boolean)
    if (points.length === 1 && (text.includes('•') || text.includes('â€¢'))) {
      points = text.split(/•|â€¢/).map(p => p.trim()).filter(Boolean)
    }

    if ((bulletOnMultiple && points.length > 1) || points.length > 2) {
      const cleanPoints = points.map(p => p.replace(/^[-•*â€¢]\s*/, ''))
      return cleanPoints.map((point, idx) => (
        <Text key={idx} style={[styles.webPreviewBullet, dStyles.webPreviewBullet]}>• {point}</Text>
      ))
    }

    return <Text style={[styles.webPreviewBody, dStyles.webPreviewBody]}>{text}</Text>
  }

  const ScaledWebPreview = ({ finalResume, theme, showPhoto, previewScale }) => {
    const [contentHeight, setContentHeight] = useState(1075);
    return (
      <View style={{ width: 760 * previewScale, height: contentHeight * previewScale, alignSelf: 'center', overflow: 'hidden' }}>
        <View 
          onLayout={(e) => setContentHeight(Math.max(1075, e.nativeEvent.layout.height))}
          style={[styles.webA4Sheet, { transform: [{ scale: previewScale }], transformOrigin: 'top left' }]}
        >
          <WebResumeContent finalResume={finalResume} theme={theme} showPhoto={showPhoto} />
        </View>
      </View>
    );
  };

  const WebResumeContent = React.memo(({ finalResume, theme, showPhoto }) => {
      const dStyles = getDynamicStyles(theme);
      const alignStyle = showPhoto && finalResume.personal?.photoURL ? 'left' : 'center';
      
      const webSections = {
        summary: finalResume.summary ? (
          <View key="summary" style={styles.webPreviewSection}>
            <Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Summary</Text>
            {renderWebPreviewText(finalResume.summary, false, dStyles)}
          </View>
        ) : null,
        education: finalResume.education?.length ? (
          <View key="education" style={styles.webPreviewSection}>
            <Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Education</Text>
            {finalResume.education.map((ed, idx) => (
              <View key={idx} style={styles.webPreviewItem}>
                <View style={styles.webPreviewItemHeader}>
                  <Text style={[styles.webPreviewStrong, dStyles.webPreviewStrong]}>{ed.institution}</Text>
                  <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{ed.duration}</Text>
                </View>
                <Text style={[styles.webPreviewBody, dStyles.webPreviewBody]}>{ed.course}</Text>
                {ed.score ? <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{getScoreLabel(ed.score)}: {ed.score}</Text> : null}
              </View>
            ))}
          </View>
        ) : null,
        experience: finalResume.experience?.length ? (
          <View key="experience" style={styles.webPreviewSection}>
            <Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Work Experience</Text>
            {finalResume.experience.map((exp, idx) => (
              <View key={idx} style={styles.webPreviewItem}>
                <View style={styles.webPreviewItemHeader}>
                  <Text style={[styles.webPreviewStrong, dStyles.webPreviewStrong]}>{[exp.company, exp.role].filter(Boolean).join(' | ')}</Text>
                  {exp.duration ? <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{exp.duration}</Text> : null}
                </View>
                {renderWebPreviewText(exp.summary, theme.experienceBullets ?? false, dStyles)}
              </View>
            ))}
          </View>
        ) : null,
        skills: finalResume.skills ? (
          <View key="skills" style={styles.webPreviewSection}>
            <Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Skills</Text>
            {typeof finalResume.skills === 'string' ? finalResume.skills.split('\n').map((line, idx) => {
              const colonIdx = line.indexOf(':');
              if (colonIdx !== -1) {
                return <Text key={idx} style={[styles.webPreviewBody, dStyles.webPreviewBody]}><Text style={{ fontWeight: 'bold' }}>{line.substring(0, colonIdx + 1)}</Text>{line.substring(colonIdx + 1)}</Text>;
              }
              return <Text key={idx} style={[styles.webPreviewBody, dStyles.webPreviewBody]}>{line}</Text>;
            }) : <Text style={[styles.webPreviewBody, dStyles.webPreviewBody]}>{finalResume.skills}</Text>}
          </View>
        ) : null,
        projects: finalResume.projects?.length ? (
          <View key="projects" style={styles.webPreviewSection}>
            <Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Projects</Text>
            {finalResume.projects.map((proj, idx) => {
              const topLinks = [proj.demoLink && { url: proj.demoLink, label: 'Live Demo' }, proj.docLink && { url: proj.docLink, label: 'Docs' }, proj.videoLink && { url: proj.videoLink, label: 'Video' }, proj.gitLink && { url: proj.gitLink, label: 'GitHub' }].filter(Boolean).slice(0, 2);
              return (
                <View key={idx} style={styles.webPreviewItem}>
                  <View style={styles.webPreviewItemHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', flex: 1 }}>
                      <Text style={[styles.webPreviewStrong, dStyles.webPreviewStrong]}>{proj.name}</Text>
                      {topLinks.map((link, i) => <Text key={i} style={[styles.webPreviewLinkItem, dStyles.webPreviewLinkItem, { marginLeft: 8, fontSize: 11, fontWeight: 'normal' }]} onPress={() => Linking.openURL(ensureAbsoluteUrl(link.url))}>[{link.label}]</Text>)}
                    </View>
                    {proj.role ? <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{proj.role}</Text> : null}
                  </View>
                  <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{[proj.type, proj.techStack].filter(Boolean).join(' | ')}</Text>
                  {renderWebPreviewText(proj.summary, theme.projectsBullets ?? true, dStyles)}
                </View>
              )
            })}
          </View>
        ) : null,
        achievements: finalResume.achievements?.length ? (
          <View key="achievements" style={styles.webPreviewSection}>
            <Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Accomplishments</Text>
            {finalResume.achievements.map((ach, idx) => (
              <Text key={idx} style={[styles.webPreviewBullet, dStyles.webPreviewBullet]}>• {ach.text}</Text>
            ))}
          </View>
        ) : null
      };

      return (
        <View style={styles.webCompactCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: showPhoto && finalResume.personal?.photoURL ? 70 : 0, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.webPreviewName, dStyles.webPreviewName, { textAlign: alignStyle }]}>{finalResume.personal?.name}</Text>
              <Text style={[styles.webPreviewMeta, dStyles.webPreviewMeta, { textAlign: alignStyle }]}>
                {[finalResume.personal?.phone, finalResume.personal?.email].filter(Boolean).join(' | ')}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: alignStyle === 'left' ? 'flex-start' : 'center', flexWrap: 'wrap', gap: 12 }}>
                {finalResume.personal?.portfolio ? <Text style={[styles.webPreviewLinkItem, dStyles.webPreviewLinkItem]} onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.portfolio))}>Portfolio</Text> : null}
                {finalResume.personal?.linkedin ? <Text style={[styles.webPreviewLinkItem, dStyles.webPreviewLinkItem]} onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.linkedin))}>LinkedIn</Text> : null}
                {finalResume.personal?.github ? <Text style={[styles.webPreviewLinkItem, dStyles.webPreviewLinkItem]} onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.github))}>GitHub</Text> : null}
                {finalResume.personal?.leetcode ? <Text style={[styles.webPreviewLinkItem, dStyles.webPreviewLinkItem]} onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.leetcode))}>LeetCode</Text> : null}
              </View>
            </View>
            {showPhoto && finalResume.personal?.photoURL && (
              <Image source={{ uri: finalResume.personal.photoURL }} style={{ width: 70, height: 70, marginLeft: 16 }} />
            )}
          </View>
            {(theme.sectionOrder || defaultSectionOrder).map(sec => webSections[sec])}
        </View>
      );
  });

  const renderWebResumePreview = () => {
    const availableWidth = windowWidth > 0 ? windowWidth - 64 : 760; 
    const previewScale = Math.min(1, availableWidth / 760);

    return (
      <ScaledWebPreview finalResume={finalResume} theme={theme} showPhoto={showPhoto} previewScale={previewScale} appTheme={appTheme} />
    );
  };

  return (
    <View style={styles.container}>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
        {!finalResume ? (
          <>
            
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholderTextColor={appTheme.textMuted}
              placeholder="Paste the role, requirements, and tech stack here..." 
              value={jd} 
              onChangeText={setJd} 
              multiline 
            />

            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={loading}>
              {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={appTheme.primaryText} size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.generateButtonText}>Generating... {progress}%</Text>
                </View>
              ) : <Text style={styles.generateButtonText}>Generate with AI</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.resultContainer}>
              <View style={styles.resultHeaderRow}>
              <View style={{ flex: 1, minWidth: 200, justifyContent: 'center' }}>
                <Text style={[styles.successTitle, { fontSize: Math.max(16, Math.min(30, windowWidth * 0.07)) }]} adjustsFontSizeToFit={true} numberOfLines={1}>RESUME GENERATED</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity style={[styles.confirmButton, { backgroundColor: appTheme.primary }]} onPress={() => setSaveModalVisible(true)} disabled={loading}>
                    <Text style={styles.confirmButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Extracted Job Role */}
              {finalResume.roleName && (
                <Text style={styles.previewRoleTitle}>{finalResume.roleName} - Preview:</Text>
              )}

              {/* VISUAL RESUME LAYOUT */}
              {Platform.OS === 'web' ? (
                <View style={styles.webPreviewShell}>
                  <ScrollView style={styles.webPreviewScroller} contentContainerStyle={styles.webPreviewContent}>
                    {renderWebResumePreview()}
                  </ScrollView>
                </View>
              ) : (
                <View style={[styles.resumePreview, Platform.OS === 'web' && styles.webResumePreview]}>
                
                {(() => {
                  const alignStyle = showPhoto && finalResume.personal?.photoURL ? 'left' : 'center';
                  return (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: showPhoto && finalResume.personal?.photoURL ? 70 : 0, marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        {/* 1. Name */}
                        {finalResume.personal?.nameLink ? (
                          <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.nameLink))}>
                            <Text style={[styles.resumeName, styles.linkableText, dStyles.resumeName, { textAlign: alignStyle }]}>{finalResume.personal?.name}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={[styles.resumeName, dStyles.resumeName, { textAlign: alignStyle }]}>{finalResume.personal?.name}</Text>
                        )}

                        {/* 3. Contact Details */}
                        <View style={[styles.resumeContacts, { justifyContent: alignStyle === 'left' ? 'flex-start' : 'center' }]}>
                          {finalResume.personal?.phone ? (
                            finalResume.personal.phoneLink ? (
                              <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.phoneLink))}>
                                <Text style={[styles.resumeContactItem, styles.linkableText, dStyles.resumeContactItem]}>{finalResume.personal.phone}</Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={[styles.resumeContactItem, dStyles.resumeContactItem]}>{finalResume.personal.phone}</Text>
                            )
                          ) : null}
                          
                          {finalResume.personal?.phone && finalResume.personal?.email ? <Text style={[styles.resumeContactItem, dStyles.resumeContactItem]}>  |  </Text> : null}
                          
                          {finalResume.personal?.email ? <Text style={[styles.resumeContactItem, dStyles.resumeContactItem]}>{finalResume.personal.email}</Text> : null}
                        </View>

                        {/* 4. Links */}
                        <View style={[styles.resumeLinks, { justifyContent: alignStyle === 'left' ? 'flex-start' : 'center', marginBottom: 0 }]}>
                          {finalResume.personal?.portfolio ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.portfolio))}><Text style={[styles.resumeLinkItem, dStyles.resumeLinkItem]}>Portfolio</Text></TouchableOpacity> : null}
                          {finalResume.personal?.linkedin ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.linkedin))}><Text style={[styles.resumeLinkItem, dStyles.resumeLinkItem]}>LinkedIn</Text></TouchableOpacity> : null}
                          {finalResume.personal?.github ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.github))}><Text style={[styles.resumeLinkItem, dStyles.resumeLinkItem]}>GitHub</Text></TouchableOpacity> : null}
                          {finalResume.personal?.leetcode ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.personal.leetcode))}><Text style={[styles.resumeLinkItem, dStyles.resumeLinkItem]}>LeetCode</Text></TouchableOpacity> : null}
                        </View>
                      </View>

                      {/* 2. Photo (Conditional) */}
                      {showPhoto && finalResume.personal?.photoURL && (
                        <Image source={{ uri: finalResume.personal.photoURL }} style={{ width: 70, height: 70, marginLeft: 16 }} />
                      )}
                    </View>
                  );
                })()}

                <View style={styles.resumeDivider} />

                {(() => {
                  const nativeSections = {
                    summary: finalResume.summary ? (
                      <View key="summary">
                        <Text style={[styles.resumeSectionTitle, dStyles.resumeSectionTitle]}>Summary</Text>
                        {renderNativeContent(finalResume.summary, finalResume.summaryLink, false, dStyles)}
                      </View>
                    ) : null,
                    education: finalResume.education && finalResume.education.length > 0 ? (
                      <View key="education">
                        <Text style={[styles.resumeSectionTitle, dStyles.resumeSectionTitle]}>Education</Text>
                        {finalResume.education.map((ed, idx) => (
                          <View key={idx} style={styles.resumeItemBlock}>
                            <View style={styles.resumeItemHeader}>
                              {ed.institutionLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(ed.institutionLink))}><Text style={[styles.resumeItemTitle, styles.linkableText, dStyles.resumeItemTitle]}>{ed.institution}</Text></TouchableOpacity> : <Text style={[styles.resumeItemTitle, dStyles.resumeItemTitle]}>{ed.institution}</Text>}
                              {ed.durationLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(ed.durationLink))}><Text style={[styles.resumeItemDate, styles.linkableText, dStyles.resumeItemDate]}>{ed.duration}</Text></TouchableOpacity> : <Text style={[styles.resumeItemDate, dStyles.resumeItemDate]}>{ed.duration}</Text>}
                            </View>
                            {ed.courseLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(ed.courseLink))}><Text style={[styles.resumeItemSubtitle, styles.linkableText, dStyles.resumeItemSubtitle]}>{ed.course}</Text></TouchableOpacity> : <Text style={[styles.resumeItemSubtitle, dStyles.resumeItemSubtitle]}>{ed.course}</Text>}
                            {ed.score ? (ed.scoreLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(ed.scoreLink))}><Text style={[styles.resumeText, styles.linkableText, dStyles.resumeText]}>{getScoreLabel(ed.score)}: {ed.score}</Text></TouchableOpacity> : <Text style={[styles.resumeText, dStyles.resumeText]}>{getScoreLabel(ed.score)}: {ed.score}</Text>) : null}
                          </View>
                        ))}
                      </View>
                    ) : null,
                    experience: finalResume.experience && finalResume.experience.length > 0 ? (
                      <View key="experience">
                        <Text style={[styles.resumeSectionTitle, dStyles.resumeSectionTitle]}>Work Experience</Text>
                        {finalResume.experience.map((exp, idx) => (
                          <View key={idx} style={styles.resumeItemBlock}>
                            <View style={styles.resumeItemHeader}>
                              {exp.companyLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(exp.companyLink))}><Text style={[styles.resumeItemTitle, styles.linkableText, dStyles.resumeItemTitle]}>{exp.company}</Text></TouchableOpacity> : <Text style={[styles.resumeItemTitle, dStyles.resumeItemTitle]}>{exp.company}</Text>}
                              {exp.durationLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(exp.durationLink))}><Text style={[styles.resumeItemDate, styles.linkableText, dStyles.resumeItemDate]}>{exp.duration}</Text></TouchableOpacity> : <Text style={[styles.resumeItemDate, dStyles.resumeItemDate]}>{exp.duration}</Text>}
                            </View>
                            {exp.roleLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(exp.roleLink))}><Text style={[styles.resumeItemSubtitle, styles.linkableText, dStyles.resumeItemSubtitle]}>{exp.role}</Text></TouchableOpacity> : <Text style={[styles.resumeItemSubtitle, dStyles.resumeItemSubtitle]}>{exp.role}</Text>}
                            {renderNativeContent(exp.summary, exp.summaryLink, theme.experienceBullets ?? false, dStyles)}
                          </View>
                        ))}
                      </View>
                    ) : null,
                    skills: finalResume.skills ? (
                      <View key="skills">
                        <Text style={[styles.resumeSectionTitle, dStyles.resumeSectionTitle]}>Skills</Text>
                        {finalResume.skillsLink ? (
                          <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(finalResume.skillsLink))}>
                            {typeof finalResume.skills === 'string' ? finalResume.skills.split('\n').map((line, idx) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx !== -1) {
                                return <Text key={idx} style={[styles.resumeText, styles.linkableText, dStyles.resumeText]}><Text style={{ fontWeight: 'bold' }}>{line.substring(0, colonIdx + 1)}</Text>{line.substring(colonIdx + 1)}</Text>;
                              }
                              return <Text key={idx} style={[styles.resumeText, styles.linkableText, dStyles.resumeText]}>{line}</Text>;
                            }) : <Text style={[styles.resumeText, styles.linkableText, dStyles.resumeText]}>{finalResume.skills}</Text>}
                          </TouchableOpacity>
                        ) : (
                          <View>
                            {typeof finalResume.skills === 'string' ? finalResume.skills.split('\n').map((line, idx) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx !== -1) {
                                return <Text key={idx} style={[styles.resumeText, dStyles.resumeText]}><Text style={{ fontWeight: 'bold' }}>{line.substring(0, colonIdx + 1)}</Text>{line.substring(colonIdx + 1)}</Text>;
                              }
                              return <Text key={idx} style={[styles.resumeText, dStyles.resumeText]}>{line}</Text>;
                            }) : <Text style={[styles.resumeText, dStyles.resumeText]}>{finalResume.skills}</Text>}
                          </View>
                        )}
                      </View>
                    ) : null,
                    projects: finalResume.projects && finalResume.projects.length > 0 ? (
                      <View key="projects">
                        <Text style={[styles.resumeSectionTitle, dStyles.resumeSectionTitle]}>Projects</Text>
                        {finalResume.projects.map((proj, idx) => {
                          const topLinks = [proj.demoLink && { url: proj.demoLink, label: 'Live Demo' }, proj.docLink && { url: proj.docLink, label: 'Docs' }, proj.videoLink && { url: proj.videoLink, label: 'Video' }, proj.gitLink && { url: proj.gitLink, label: 'GitHub' }].filter(Boolean).slice(0, 2);
                          return (
                            <View key={idx} style={styles.resumeItemBlock}>
                              <View style={styles.resumeItemHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', flex: 1 }}>
                                  {proj.nameLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(proj.nameLink))}><Text style={[styles.resumeItemTitle, styles.linkableText, dStyles.resumeItemTitle]}>{proj.name}</Text></TouchableOpacity> : <Text style={[styles.resumeItemTitle, dStyles.resumeItemTitle]}>{proj.name}</Text>}
                                  {topLinks.map((link, i) => <TouchableOpacity key={i} onPress={() => Linking.openURL(ensureAbsoluteUrl(link.url))}><Text style={[styles.projectLinkItem, dStyles.projectLinkItem, { marginLeft: 8 }]}>[{link.label}]</Text></TouchableOpacity>)}
                                </View>
                                {proj.role ? (proj.roleLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(proj.roleLink))}><Text style={[styles.resumeItemDate, styles.linkableText, dStyles.resumeItemDate]}>{proj.role}</Text></TouchableOpacity> : <Text style={[styles.resumeItemDate, dStyles.resumeItemDate]}>{proj.role}</Text>) : null}
                              </View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
                                {proj.typeLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(proj.typeLink))}><Text style={[styles.resumeItemSubtitle, styles.linkableText, dStyles.resumeItemSubtitle]}>{proj.type}</Text></TouchableOpacity> : <Text style={[styles.resumeItemSubtitle, dStyles.resumeItemSubtitle]}>{proj.type}</Text>}
                                <Text style={[styles.resumeItemSubtitle, dStyles.resumeItemSubtitle]}> | </Text>
                                {proj.techStackLink ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(proj.techStackLink))}><Text style={[styles.resumeItemSubtitle, styles.linkableText, dStyles.resumeItemSubtitle]}>{proj.techStack}</Text></TouchableOpacity> : <Text style={[styles.resumeItemSubtitle, dStyles.resumeItemSubtitle]}>{proj.techStack}</Text>}
                              </View>
                              {renderNativeContent(proj.summary, proj.summaryLink, theme.projectsBullets ?? true, dStyles)}
                            </View>
                          )
                        })}
                      </View>
                    ) : null,
                    achievements: finalResume.achievements && finalResume.achievements.length > 0 ? (
                      <View key="achievements">
                        <Text style={[styles.resumeSectionTitle, dStyles.resumeSectionTitle]}>Accomplishments</Text>
                        {finalResume.achievements.map((ach, idx) => (
                          <View key={idx} style={styles.resumeItemBlock}>
                            {ach.link ? <TouchableOpacity onPress={() => Linking.openURL(ensureAbsoluteUrl(ach.link))}><Text style={[styles.resumeText, styles.linkableText, dStyles.resumeText]}>• {ach.text}</Text></TouchableOpacity> : <Text style={[styles.resumeText, dStyles.resumeText]}>• {ach.text}</Text>}
                          </View>
                        ))}
                      </View>
                    ) : null
                  };
                  return (theme.sectionOrder || ['summary', 'education', 'experience', 'skills', 'projects', 'achievements']).map(sec => nativeSections[sec]);
                })()}
                </View>
              )}

              {/* Minimalist Adjusters (Attached tightly below resume) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
                <TouchableOpacity style={[styles.confirmButton, { backgroundColor: appTheme.primary, borderWidth: 1, borderColor: appTheme.border }]} onPress={handleExportPDF} disabled={loading}>
                  <Text style={[styles.confirmButtonText, { color: appTheme.surface }]}>View PDF</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Stepper icon="type" value={theme.fontSizeScale || 1} min={0.8} max={1.5} step={0.05} onValueChange={(val) => setTheme(prev => ({...prev, fontSizeScale: val}))} appTheme={appTheme} />
                  <Stepper icon="menu" value={theme.lineSpacingScale || 1} min={0.8} max={2.0} step={0.1} onValueChange={(val) => setTheme(prev => ({...prev, lineSpacingScale: val}))} appTheme={appTheme} />
                </View>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 24 }]}>PROMPT</Text>
            <TextInput 
              style={[styles.input, styles.textArea, { height: 100 }]} 
              placeholderTextColor={appTheme.textMuted}
              placeholder="E.g., 'Make the summary sound more professional' or 'Add a bullet point about React hooks'" 
              value={refinePrompt} 
              onChangeText={setRefinePrompt} 
              multiline 
            />
            <TouchableOpacity style={styles.generateButton} onPress={handleRefine} disabled={loading}>
              {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={appTheme.primaryText} size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.generateButtonText}>Updating... {progress}%</Text>
                </View>
              ) : <Text style={styles.generateButtonText}>Update Resume</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={() => setClearModalVisible(true)} disabled={loading}>
              <Text style={styles.clearButtonText}>Clear Resume</Text>
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

      {/* Custom Save Modal */}
      <Modal visible={saveModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Resume</Text>
            <Text style={styles.modalMessage}>Are you sure you want to save this tailored resume?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={executeSave} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generic Popup Modal */}
      <Modal visible={popupState.visible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.successModalTitle, popupState.isError && { color: appTheme.error }]}>{popupState.title}</Text>
            <Text style={styles.modalMessage}>{popupState.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setPopupState({ ...popupState, visible: false })} style={[styles.modalConfirmBtn, { backgroundColor: appTheme.primary }]}>
                <Text style={[styles.modalConfirmText, { color: appTheme.primaryText }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const getStyles = (appTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.bg },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: appTheme.text, marginBottom: 8 },
  input: { borderRadius: 10, padding: 14, fontSize: 15, color: appTheme.text, marginBottom: 20 },
  textArea: { height: 160, textAlignVertical: 'top' },
  generateButton: { backgroundColor: appTheme.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  generateButtonText: { color: appTheme.primaryText, fontSize: 16, fontWeight: 'bold' },
  clearButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: appTheme.border, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  clearButtonText: { color: appTheme.text, fontSize: 16, fontWeight: 'bold' },
  confirmButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  confirmButtonText: { color: appTheme.primaryText, fontSize: 14, fontWeight: 'bold' },
  
  slidersContainer: { padding: 16, borderRadius: 12, marginBottom: 16 },
  
  resultContainer: { 
    marginTop: 30, 
    padding: 16, 
    borderRadius: 12
  },
  successTitle: { fontSize: 15, fontWeight: 'bold', color: appTheme.text, marginBottom: 8 },
  resultDesc: { fontSize: 14, color: appTheme.textMuted, marginBottom: 16 },
  previewRoleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: appTheme.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5
  },
  webPreviewShell: {
    height: 720,
    maxHeight: 720,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.border,
    backgroundColor: appTheme.bg
  },
  webPreviewScroller: {
    height: '100%',
    maxHeight: '100%',
    overflow: 'scroll',
    backgroundColor: appTheme.bg
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
    width: 760,
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
    marginBottom: 10
  },
  webPreviewHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  webPreviewItem: {
    marginBottom: 8
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
    color: '#FFFFFF',
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 8
  },
  resultHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  photoToggleContainer: { alignItems: 'center' },
  photoToggleLabel: { color: appTheme.textMuted, fontSize: 12, marginBottom: 4 },
  resumePreview: { backgroundColor: '#fff', padding: 24, borderRadius: 8 },
  resumeName: { fontSize: 24, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 8 },
  resumePhoto: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 12 },
  resumeContacts: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 },
  resumeContactItem: { fontSize: 13, color: '#333' },
  resumeLinks: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  resumeLinkItem: { fontSize: 13, color: '#2563EB', textDecorationLine: 'underline' },
  resumeDivider: { height: 1, backgroundColor: '#ccc', marginVertical: 8 },
  resumeSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  resumeText: { fontSize: 13, color: '#333', lineHeight: 20 },
  linkableText: { color: '#2563EB', textDecorationLine: 'underline' },
  resumeItemBlock: { marginBottom: 10 },
  resumeItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  resumeItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  resumeItemDate: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  resumeItemSubtitle: { fontSize: 13, fontWeight: '600', color: '#444' },
  projectLinks: { flexDirection: 'row', gap: 12, marginTop: 6 },
  projectLinkItem: { fontSize: 12, color: '#2563EB', textDecorationLine: 'underline' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: appTheme.surface, padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: appTheme.border },
  modalTitle: { color: appTheme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  successModalTitle: { color: appTheme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalMessage: { color: appTheme.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 12 },
  modalCancelText: { color: appTheme.textMuted, fontWeight: '600' },
  modalConfirmBtn: { backgroundColor: appTheme.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalConfirmText: { color: appTheme.primaryText, fontWeight: 'bold' }
})
