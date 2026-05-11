import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'

export default function FormScreen({ user, onSignOut, onGoToBuilder }) {
  const [loading, setLoading] = useState(false)

  // Form States
  const [personal, setPersonal] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    linkedin: '',
    leetcode: '',
    github: '',
    portfolio: '',
    photoURL: user.photoURL || ''
  })

  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState('')
  const [achievements, setAchievements] = useState([''])

  const [education, setEducation] = useState([
    { institution: '', course: '', duration: '', score: '' }
  ])

  const [experience, setExperience] = useState([
    { company: '', duration: '', role: '', summary: '' }
  ])

  const [projects, setProjects] = useState([
    { name: '', type: '', role: '', docLink: '', videoLink: '', demoLink: '', techStack: '', summary: '' }
  ])

  // Auto-fetch existing user data on load
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const docRef = doc(db, 'resumes', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          if (data.personal) setPersonal(data.personal)
          if (data.summary) setSummary(data.summary)
          if (data.skills) setSkills(data.skills)
          if (data.education && data.education.length) setEducation(data.education)
          if (data.experience && data.experience.length) setExperience(data.experience)
          if (data.projects && data.projects.length) setProjects(data.projects)
          if (data.achievements && data.achievements.length) setAchievements(data.achievements)
        }
      } catch (error) {
        console.error("Error loading resume:", error)
      }
    }
    loadSavedData()
  }, [user.uid])

  // Helper functions for dynamic arrays
  const updateEducation = (index, field, value) => {
    const newEd = [...education]
    newEd[index][field] = value
    setEducation(newEd)
  }
  const addEducation = () => setEducation([...education, { institution: '', course: '', duration: '', score: '' }])

  const updateExperience = (index, field, value) => {
    const newExp = [...experience]
    newExp[index][field] = value
    setExperience(newExp)
  }
  const addExperience = () => setExperience([...experience, { company: '', duration: '', role: '', summary: '' }])

  const updateProject = (index, field, value) => {
    const newProj = [...projects]
    newProj[index][field] = value
    setProjects(newProj)
  }
  const addProject = () => setProjects([...projects, { name: '', type: '', role: '', docLink: '', videoLink: '', demoLink: '', techStack: '', summary: '' }])

  const updateAchievement = (index, value) => {
    const newAchievements = [...achievements]
    newAchievements[index] = value
    setAchievements(newAchievements)
  }
  const addAchievement = () => setAchievements([...achievements, ''])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save to Firestore under the 'resumes' collection using the user's UID
      await setDoc(doc(db, 'resumes', user.uid), {
        userId: user.uid,
        personal,
        skills,
        summary,
        education,
        experience,
        projects,
        achievements,
        updatedAt: new Date().toISOString()
      }, { merge: true }) // Using merge ensures we don't wipe out other fields unintentionally
      Alert.alert('Success', 'Resume details saved successfully!', [
        { text: 'OK', onPress: onGoToBuilder }
      ])
    } catch (error) {
      console.error('Error saving resume:', error)
      Alert.alert('Error', 'Failed to save details. Please check your Firebase rules.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {user.photoURL && <Image source={{ uri: user.photoURL }} style={styles.avatar} />}
          <View>
            <Text style={styles.headerTitle}>Build Your Resume</Text>
            <Text style={styles.headerEmail}>{user.email}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onGoToBuilder} style={styles.buildBtn}>
            <Text style={styles.buildText}>Tailor Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <TextInput style={styles.input} placeholder="Full Name" value={personal.name} onChangeText={t => setPersonal({ ...personal, name: t })} />
        <TextInput style={styles.input} placeholder="Email ID" value={personal.email} onChangeText={t => setPersonal({ ...personal, email: t })} keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Phone Number" value={personal.phone} onChangeText={t => setPersonal({ ...personal, phone: t })} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="LinkedIn URL" value={personal.linkedin} onChangeText={t => setPersonal({ ...personal, linkedin: t })} />
        <TextInput style={styles.input} placeholder="GitHub URL" value={personal.github} onChangeText={t => setPersonal({ ...personal, github: t })} />
        <TextInput style={styles.input} placeholder="LeetCode URL" value={personal.leetcode} onChangeText={t => setPersonal({ ...personal, leetcode: t })} />
        <TextInput style={styles.input} placeholder="Portfolio URL" value={personal.portfolio} onChangeText={t => setPersonal({ ...personal, portfolio: t })} />
      </View>

      {/* Skills */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Skills (Base)</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="React Native, Firebase, JavaScript..." value={skills} onChangeText={setSkills} multiline />
      </View>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Brief summary about yourself..." value={summary} onChangeText={setSummary} multiline />
      </View>

      {/* Education */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Education</Text>
        {education.map((ed, index) => (
          <View key={index} style={styles.itemBlock}>
            <TextInput style={styles.input} placeholder="Institution Name" value={ed.institution} onChangeText={t => updateEducation(index, 'institution', t)} />
            <TextInput style={styles.input} placeholder="Course / Degree" value={ed.course} onChangeText={t => updateEducation(index, 'course', t)} />
            <TextInput style={styles.input} placeholder="Duration (e.g. 2018 - 2022)" value={ed.duration} onChangeText={t => updateEducation(index, 'duration', t)} />
            <TextInput style={styles.input} placeholder="CGPA / Percentage" value={ed.score} onChangeText={t => updateEducation(index, 'score', t)} />
          </View>
        ))}
        <TouchableOpacity onPress={addEducation} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Education</Text>
        </TouchableOpacity>
      </View>

      {/* Work Experience */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        {experience.map((exp, index) => (
          <View key={index} style={styles.itemBlock}>
            <TextInput style={styles.input} placeholder="Company Name" value={exp.company} onChangeText={t => updateExperience(index, 'company', t)} />
            <TextInput style={styles.input} placeholder="Role / Title" value={exp.role} onChangeText={t => updateExperience(index, 'role', t)} />
            <TextInput style={styles.input} placeholder="Duration (e.g. Jan 2021 - Present)" value={exp.duration} onChangeText={t => updateExperience(index, 'duration', t)} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Summary of responsibilities..." value={exp.summary} onChangeText={t => updateExperience(index, 'summary', t)} multiline />
          </View>
        ))}
        <TouchableOpacity onPress={addExperience} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Experience</Text>
        </TouchableOpacity>
      </View>

      {/* Projects */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Projects</Text>
        {projects.map((proj, index) => (
          <View key={index} style={styles.itemBlock}>
            <TextInput style={styles.input} placeholder="Project Name" value={proj.name} onChangeText={t => updateProject(index, 'name', t)} />
            <TextInput style={styles.input} placeholder="Project Type (e.g. Academic, Personal, Freelance)" value={proj.type} onChangeText={t => updateProject(index, 'type', t)} />
            <TextInput style={styles.input} placeholder="Your Role (e.g. Frontend Developer)" value={proj.role} onChangeText={t => updateProject(index, 'role', t)} />
            <TextInput style={styles.input} placeholder="Tech Stack (e.g. React Native, Firebase)" value={proj.techStack} onChangeText={t => updateProject(index, 'techStack', t)} />
            <TextInput style={styles.input} placeholder="Documentation Link (Optional)" value={proj.docLink} onChangeText={t => updateProject(index, 'docLink', t)} />
            <TextInput style={styles.input} placeholder="Video Link (Optional)" value={proj.videoLink} onChangeText={t => updateProject(index, 'videoLink', t)} />
            <TextInput style={styles.input} placeholder="Live Demo Link (Optional)" value={proj.demoLink} onChangeText={t => updateProject(index, 'demoLink', t)} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="2-point summary of the project..." value={proj.summary} onChangeText={t => updateProject(index, 'summary', t)} multiline />
          </View>
        ))}
        <TouchableOpacity onPress={addProject} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Project</Text>
        </TouchableOpacity>
      </View>

      {/* Achievements */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {achievements.map((achievement, index) => (
          <View key={index} style={styles.itemBlock}>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Describe an achievement, award, or certification..." value={achievement} onChangeText={t => updateAchievement(index, t)} multiline />
          </View>
        ))}
        <TouchableOpacity onPress={addAchievement} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Achievement</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Resume Details</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC'
  },
  content: {
    padding: 20,
    paddingBottom: 60
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D2939'
  },
  headerEmail: {
    fontSize: 14,
    color: '#64748B'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  buildBtn: {
    padding: 8,
    marginRight: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 8
  },
  buildText: {
    color: '#3366FF',
    fontWeight: 'bold'
  },
  logoutBtn: {
    padding: 8
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    color: '#0F172A'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  itemBlock: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8
  },
  addButton: {
    alignItems: 'center',
    paddingVertical: 10
  },
  addButtonText: {
    color: '#3366FF',
    fontWeight: '600',
    fontSize: 15
  },
  saveButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
})