import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export default function BuilderScreen({ user, onGoBack, onSignOut }) {
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalResume, setFinalResume] = useState(null)

  const handleGenerate = async () => {
    if (!jd.trim()) {
      Alert.alert('Missing Info', 'Please paste a Job Description first.')
      return
    }

    setLoading(true)
    try {
      // 1. Fetch user's baseline resume from DB
      const docRef = doc(db, 'resumes', user.uid)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        Alert.alert('Error', 'No base resume found. Please fill out your details first.')
        setLoading(false)
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

      /* 
      // --- REAL AI INTEGRATION ---
      // Uncomment and replace with your Gemini API Key when ready:
      const API_KEY = "YOUR_GEMINI_API_KEY";
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const aiResult = JSON.parse(data.candidates[0].content.parts[0].text);
      */

      // --- SIMULATED AI RESPONSE FOR TESTING ---
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate network delay
      const aiResult = {
        skills: ["React Native", "Tailored Skill 1", "Tailored Skill 2"],
        projects: baseResume.projects.map(p => ({
          ...p,
          summary: `[AI Tailored specifically to JD] ${p.summary}`
        }))
      }

      // 3. Merge AI Results with Base Resume (Personal, Experience, etc. stay default)
      const tailoredResume = {
        ...baseResume,
        skills: aiResult.skills.join(', '),
        projects: aiResult.projects,
      }

      setFinalResume(tailoredResume)

    } catch (error) {
      console.error("AI Generation Error:", error)
      Alert.alert('Error', 'Failed to generate tailored resume.')
    } finally {
      setLoading(false)
    }
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
        <Text style={styles.label}>Paste Job Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Paste the role, requirements, and tech stack here..." 
          value={jd} 
          onChangeText={setJd} 
          multiline 
        />

        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateButtonText}>✨ Generate with AI</Text>}
        </TouchableOpacity>

        {finalResume && (
          <View style={styles.resultContainer}>
            <Text style={styles.successTitle}>Core Successfully Generated!</Text>
            <Text style={styles.resultDesc}>Notice how only the skills and projects are modified, while everything else remains from your database.</Text>
            <Text style={styles.jsonOutput}>
              {JSON.stringify(finalResume, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backText: { color: '#3366FF', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1D2939' },
  logoutText: { color: '#EF4444', fontWeight: '600' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, fontSize: 15, color: '#0F172A', marginBottom: 20 },
  textArea: { height: 160, textAlignVertical: 'top' },
  generateButton: { backgroundColor: '#3366FF', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultContainer: { 
    marginTop: 30, 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  successTitle: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginBottom: 8 },
  resultDesc: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  jsonOutput: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8
  }
})