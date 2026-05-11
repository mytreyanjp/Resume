import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export default function BuilderScreen({ user, onGoBack, onSignOut }) {
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalResume, setFinalResume] = useState(null)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [progress, setProgress] = useState(0)
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
        2. Rewrite and tailor ONLY the 'projects' array from my Base Resume to highlight these specific requirements.
        3. Extract a tailored 'skills' array (list of strings) based on my background and the JD.
        4. Return ONLY a valid JSON object matching this exact structure: { "skills": ["..."], "projects": [{ "name": "...", "type": "...", "role": "...", "docLink": "...", "videoLink": "...", "demoLink": "...", "techStack": "...", "summary": "..." }] }. Do not include markdown formatting like \`\`\`json.

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

  const handleClear = () => {
    Alert.alert(
      "Clear Resume",
      "Are you sure you want to clear your tailored resume? You will need to generate a new one.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            setLoading(true)
            try {
              await setDoc(doc(db, 'resumes', user.uid), { tailoredResume: null }, { merge: true })
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
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack}>
          <Text style={styles.backText}>← Back to Form</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tailor Resume</Text>
        <TouchableOpacity onPress={onSignOut}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

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
              ) : <Text style={styles.generateButtonText}>✨ Generate with AI</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.resultContainer}>
              <Text style={styles.successTitle}>Resume Generated!</Text>
              <Text style={styles.resultDesc}>Review your tailored resume below. Request changes if needed.</Text>
              <Text style={styles.jsonOutput}>
                {JSON.stringify(finalResume, null, 2)}
              </Text>
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
              ) : <Text style={styles.generateButtonText}>🔄 Update Resume</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={handleClear} disabled={loading}>
              <Text style={styles.clearButtonText}>🗑️ Clear Resume</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  backText: { color: '#60A5FA', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  logoutText: { color: '#F87171', fontWeight: '600' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155', borderRadius: 10, padding: 14, fontSize: 15, color: '#F8FAFC', marginBottom: 20 },
  textArea: { height: 160, textAlignVertical: 'top' },
  generateButton: { backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  clearButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  clearButtonText: { color: '#F87171', fontSize: 16, fontWeight: 'bold' },
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
  }
})