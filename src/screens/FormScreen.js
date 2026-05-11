import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, Platform } from 'react-native'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Feather } from '@expo/vector-icons'

export default function FormScreen({ user, onGoToBuilder }) {
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

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
  const [summaryLink, setSummaryLink] = useState('')
  const [skills, setSkills] = useState('')
  const [skillsLink, setSkillsLink] = useState('')
  const [achievements, setAchievements] = useState([{ text: '', link: '' }])

  const [education, setEducation] = useState([
    { institution: '', course: '', duration: '', score: '' }
  ])

  const [experience, setExperience] = useState([
    { company: '', duration: '', role: '', summary: '' }
  ])

  const [projects, setProjects] = useState([
    { name: '', type: '', role: '', gitLink: '', docLink: '', videoLink: '', demoLink: '', techStack: '', summary: '' }
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
          if (data.summaryLink) setSummaryLink(data.summaryLink)
          if (data.skills) setSkills(data.skills)
          if (data.skillsLink) setSkillsLink(data.skillsLink)
          if (data.education && data.education.length) setEducation(data.education)
          if (data.experience && data.experience.length) setExperience(data.experience)
          if (data.projects && data.projects.length) setProjects(data.projects)
          if (data.achievements && data.achievements.length) {
            setAchievements(data.achievements.map(a => typeof a === 'string' ? { text: a, link: '' } : a))
          }
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
  const removeEducation = (index) => setEducation(education.filter((_, i) => i !== index))

  const updateExperience = (index, field, value) => {
    const newExp = [...experience]
    newExp[index][field] = value
    setExperience(newExp)
  }
  const addExperience = () => setExperience([...experience, { company: '', duration: '', role: '', summary: '' }])
  const removeExperience = (index) => setExperience(experience.filter((_, i) => i !== index))

  const updateProject = (index, field, value) => {
    const newProj = [...projects]
    newProj[index][field] = value
    setProjects(newProj)
  }
  const addProject = () => setProjects([...projects, { name: '', type: '', role: '', gitLink: '', docLink: '', videoLink: '', demoLink: '', techStack: '', summary: '' }])
  const removeProject = (index) => setProjects(projects.filter((_, i) => i !== index))

  const updateAchievement = (index, field, value) => {
    const newAchievements = [...achievements]
    newAchievements[index][field] = value
    setAchievements(newAchievements)
  }
  const addAchievement = () => setAchievements([...achievements, { text: '', link: '' }])
  const removeAchievement = (index) => setAchievements(achievements.filter((_, i) => i !== index))

  const handleSave = async () => {
    setLoading(true)
    setSaveStatus(null)
    try {
      // Save to Firestore under the 'resumes' collection using the user's UID
      await setDoc(doc(db, 'resumes', user.uid), {
        userId: user.uid,
        personal,
        skills,
        skillsLink,
        summary,
        summaryLink,
        education,
        experience,
        projects,
        achievements,
        updatedAt: new Date().toISOString()
      }, { merge: true }) // Using merge ensures we don't wipe out other fields unintentionally
      
      setSaveStatus('success')
      if (Platform.OS === 'web') {
        if (window.confirm('Resume details saved successfully! Click OK to Tailor Resume, or Cancel to stay here.')) {
          onGoToBuilder()
        }
      } else {
        Alert.alert('Success', 'Resume details saved successfully!', [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Tailor Resume', onPress: onGoToBuilder }
        ])
      }
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Error saving resume:', error)
      setSaveStatus('error')
      if (Platform.OS === 'web') window.alert('Failed to save details. Please check your Firebase rules.')
      else Alert.alert('Error', 'Failed to save details. Please check your Firebase rules.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <LinkableInput placeholder="Full Name" value={personal.name} onChangeText={t => setPersonal({ ...personal, name: t })} linkValue={personal.nameLink || ''} onLinkChangeText={t => setPersonal({ ...personal, nameLink: t })} />
        <TextInput style={styles.input} placeholder="Email ID" value={personal.email} onChangeText={t => setPersonal({ ...personal, email: t })} keyboardType="email-address" />
        <LinkableInput placeholder="Phone Number" value={personal.phone} onChangeText={t => setPersonal({ ...personal, phone: t })} keyboardType="phone-pad" linkValue={personal.phoneLink || ''} onLinkChangeText={t => setPersonal({ ...personal, phoneLink: t })} />
        <TextInput style={styles.input} placeholder="LinkedIn URL" value={personal.linkedin} onChangeText={t => setPersonal({ ...personal, linkedin: t })} />
        <TextInput style={styles.input} placeholder="GitHub URL" value={personal.github} onChangeText={t => setPersonal({ ...personal, github: t })} />
        <TextInput style={styles.input} placeholder="LeetCode URL" value={personal.leetcode} onChangeText={t => setPersonal({ ...personal, leetcode: t })} />
        <TextInput style={styles.input} placeholder="Portfolio URL" value={personal.portfolio} onChangeText={t => setPersonal({ ...personal, portfolio: t })} />
      </View>

      {/* Skills */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Skills (Base)</Text>
        <LinkableInput placeholder="React Native, Firebase, JavaScript..." value={skills} onChangeText={setSkills} linkValue={skillsLink} onLinkChangeText={setSkillsLink} multiline />
      </View>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <LinkableInput placeholder="Brief summary about yourself..." value={summary} onChangeText={setSummary} linkValue={summaryLink} onLinkChangeText={setSummaryLink} multiline />
      </View>

      {/* Education */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Education</Text>
        {education.map((ed, index) => (
          <View key={index} style={styles.itemBlock}>
            <View style={styles.itemHeaderBlock}>
              <Text style={styles.itemLabel}>Education {index + 1}</Text>
              <TouchableOpacity onPress={() => removeEducation(index)}>
                <Feather name="trash-2" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>
            <LinkableInput placeholder="Institution Name" value={ed.institution} onChangeText={t => updateEducation(index, 'institution', t)} linkValue={ed.institutionLink || ''} onLinkChangeText={t => updateEducation(index, 'institutionLink', t)} />
            <LinkableInput placeholder="Course / Degree" value={ed.course} onChangeText={t => updateEducation(index, 'course', t)} linkValue={ed.courseLink || ''} onLinkChangeText={t => updateEducation(index, 'courseLink', t)} />
            <LinkableInput placeholder="Duration (e.g. 2018 - 2022)" value={ed.duration} onChangeText={t => updateEducation(index, 'duration', t)} linkValue={ed.durationLink || ''} onLinkChangeText={t => updateEducation(index, 'durationLink', t)} />
            <LinkableInput placeholder="CGPA / Percentage" value={ed.score} onChangeText={t => updateEducation(index, 'score', t)} linkValue={ed.scoreLink || ''} onLinkChangeText={t => updateEducation(index, 'scoreLink', t)} />
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
            <View style={styles.itemHeaderBlock}>
              <Text style={styles.itemLabel}>Experience {index + 1}</Text>
              <TouchableOpacity onPress={() => removeExperience(index)}>
                <Feather name="trash-2" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>
            <LinkableInput placeholder="Company Name" value={exp.company} onChangeText={t => updateExperience(index, 'company', t)} linkValue={exp.companyLink || ''} onLinkChangeText={t => updateExperience(index, 'companyLink', t)} />
            <LinkableInput placeholder="Role / Title" value={exp.role} onChangeText={t => updateExperience(index, 'role', t)} linkValue={exp.roleLink || ''} onLinkChangeText={t => updateExperience(index, 'roleLink', t)} />
            <LinkableInput placeholder="Duration (e.g. Jan 2021 - Present)" value={exp.duration} onChangeText={t => updateExperience(index, 'duration', t)} linkValue={exp.durationLink || ''} onLinkChangeText={t => updateExperience(index, 'durationLink', t)} />
            <LinkableInput placeholder="Summary of responsibilities..." value={exp.summary} onChangeText={t => updateExperience(index, 'summary', t)} linkValue={exp.summaryLink || ''} onLinkChangeText={t => updateExperience(index, 'summaryLink', t)} multiline />
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
            <View style={styles.itemHeaderBlock}>
              <Text style={styles.itemLabel}>Project {index + 1}</Text>
              <TouchableOpacity onPress={() => removeProject(index)}>
                <Feather name="trash-2" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>
            <LinkableInput placeholder="Project Name" value={proj.name} onChangeText={t => updateProject(index, 'name', t)} linkValue={proj.nameLink || ''} onLinkChangeText={t => updateProject(index, 'nameLink', t)} />
            <LinkableInput placeholder="Project Type (e.g. Academic, Personal, Freelance)" value={proj.type} onChangeText={t => updateProject(index, 'type', t)} linkValue={proj.typeLink || ''} onLinkChangeText={t => updateProject(index, 'typeLink', t)} />
            <LinkableInput placeholder="Your Role (e.g. Frontend Developer)" value={proj.role} onChangeText={t => updateProject(index, 'role', t)} linkValue={proj.roleLink || ''} onLinkChangeText={t => updateProject(index, 'roleLink', t)} />
            <LinkableInput placeholder="Tech Stack (e.g. React Native, Firebase)" value={proj.techStack} onChangeText={t => updateProject(index, 'techStack', t)} linkValue={proj.techStackLink || ''} onLinkChangeText={t => updateProject(index, 'techStackLink', t)} />
            <TextInput style={styles.input} placeholder="GitHub/Git Link (Optional)" value={proj.gitLink} onChangeText={t => updateProject(index, 'gitLink', t)} />
            <TextInput style={styles.input} placeholder="Documentation Link (Optional)" value={proj.docLink} onChangeText={t => updateProject(index, 'docLink', t)} />
            <TextInput style={styles.input} placeholder="Video Link (Optional)" value={proj.videoLink} onChangeText={t => updateProject(index, 'videoLink', t)} />
            <TextInput style={styles.input} placeholder="Live Demo Link (Optional)" value={proj.demoLink} onChangeText={t => updateProject(index, 'demoLink', t)} />
            <LinkableInput placeholder="2-point summary of the project..." value={proj.summary} onChangeText={t => updateProject(index, 'summary', t)} linkValue={proj.summaryLink || ''} onLinkChangeText={t => updateProject(index, 'summaryLink', t)} multiline />
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
            <View style={styles.itemHeaderBlock}>
              <Text style={styles.itemLabel}>Achievement {index + 1}</Text>
              <TouchableOpacity onPress={() => removeAchievement(index)}>
                <Feather name="trash-2" size={18} color="#F87171" />
              </TouchableOpacity>
            </View>
            <LinkableInput placeholder="Describe an achievement, award, or certification..." value={achievement.text} onChangeText={t => updateAchievement(index, 'text', t)} linkValue={achievement.link || ''} onLinkChangeText={t => updateAchievement(index, 'link', t)} multiline />
          </View>
        ))}
        <TouchableOpacity onPress={addAchievement} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Achievement</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={[styles.saveButton, saveStatus === 'success' && { backgroundColor: '#10B981' }, saveStatus === 'error' && { backgroundColor: '#EF4444' }]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{saveStatus === 'success' ? 'Saved Successfully' : saveStatus === 'error' ? 'Failed to Save' : 'Save Resume Details'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  content: {
    padding: 20,
    paddingBottom: 60
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    color: '#F8FAFC'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  itemBlock: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8
  },
  itemHeaderBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  itemLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600'
  },
  addButton: {
    alignItems: 'center',
    paddingVertical: 10
  },
  addButtonText: {
    color: '#60A5FA',
    fontWeight: '600',
    fontSize: 15
  },
  saveButton: {
    backgroundColor: '#3B82F6',
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

// Custom component to add a "🔗" toggle button onto generic text inputs
const LinkableInput = ({ placeholder, value, onChangeText, linkValue, onLinkChangeText, multiline, keyboardType }) => {
  const [showLink, setShowLink] = React.useState(false)
  
  // If a link was previously saved, show the link input automatically
  React.useEffect(() => {
    if (linkValue) setShowLink(true)
  }, [linkValue])

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={[styles.input, { padding: 0, flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', marginBottom: 0 }]}>
        <TextInput
          style={[{ flex: 1, padding: 14, color: '#F8FAFC', fontSize: 15, textAlignVertical: multiline ? 'top' : 'center' }, multiline && styles.textArea]}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
        />
        <TouchableOpacity onPress={() => setShowLink(!showLink)} style={{ padding: 14 }}>
          <Feather name="link" size={16} color={showLink || linkValue ? '#3B82F6' : '#64748B'} />
        </TouchableOpacity>
      </View>
      {showLink && (
        <TextInput
          style={[styles.input, { marginTop: 8, borderColor: '#3B82F6', marginBottom: 0 }]}
          placeholder={`${placeholder} Link (URL)`}
          placeholderTextColor="#64748B"
          value={linkValue}
          onChangeText={onLinkChangeText}
          keyboardType="url"
          autoCapitalize="none"
        />
      )}
    </View>
  )
}