import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// --- ATS-OPTIMIZED HTML GENERATOR ---
const generateATSResumeHTML = (resume, showPhoto, theme = { font: 'Arial', color: '#000000', align: 'center' }) => {
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
        @page { size: A4; margin: 15mm; }
        body { font-family: '${theme.font}', Helvetica, sans-serif; color: #000; font-size: 11pt; line-height: 1.4; margin: 0; padding: 0; background: #e2e8f0; }
        .a4-container { background: #fff; width: 210mm; max-width: 100%; min-height: 297mm; margin: 20px auto; padding: 15mm; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
        @media print { body { background: #fff; } .a4-container { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; } }
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
      <h1>${makeLink(personal?.name || 'Your Name', personal?.nameLink)}</h1>
      ${showPhoto && personal?.photoURL ? `<div class="photo-container"><img src="${personal.photoURL}" alt="Profile Photo" /></div>` : ''}
      <div class="contact-info">
        ${makeLink(personal?.phone || '', personal?.phoneLink)} 
        ${personal?.phone && personal?.email ? ' | ' : ''} 
        ${personal?.email || ''}
      </div>
      <div class="links-bar">
        ${personal?.portfolio ? `<a href="${personal.portfolio}">Portfolio</a>` : ''}
        ${personal?.linkedin ? `<a href="${personal.linkedin}">LinkedIn</a>` : ''}
        ${personal?.github ? `<a href="${personal.github}">GitHub</a>` : ''}
        ${personal?.leetcode ? `<a href="${personal.leetcode}">LeetCode</a>` : ''}
      </div>
      
      ${(() => {
        const sectionsHTML = {
          summary: summary ? `\n        <h2>Professional Summary</h2>\n        <div class="section-content">\n          ${formatContent(summary, summaryLink)}\n        </div>\n      ` : '',
          education: education && education.length > 0 ? `\n        <h2>Education</h2>\n        <div class="section-content">\n          ${education.map(ed => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(ed.institution, ed.institutionLink)}</span>\n                <span class="item-date">${makeLink(ed.duration, ed.durationLink)}</span>\n              </div>\n              <div class="item-subtitle">${makeLink(ed.course, ed.courseLink)}</div>\n              ${ed.score ? `<div>Score: ${makeLink(ed.score, ed.scoreLink)}</div>` : ''}\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          experience: experience && experience.length > 0 ? `\n        <h2>Work Experience</h2>\n        <div class="section-content">\n          ${experience.map(exp => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(exp.company, exp.companyLink)} | <span style="font-weight:normal">${makeLink(exp.role, exp.roleLink)}</span></span>\n                <span class="item-date">${makeLink(exp.duration, exp.durationLink)}</span>\n              </div>\n              <div class="item-desc">${formatContent(exp.summary, exp.summaryLink, theme.experienceBullets ?? false)}</div>\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          skills: skills ? `\n        <h2>Skills</h2>\n        <div class="section-content">\n          ${makeLink(typeof skills === 'string' ? skills.replace(/\n/g, '<br>') : skills, skillsLink)}\n        </div>\n      ` : '',
          projects: projects && projects.length > 0 ? `\n        <h2>Projects</h2>\n        <div class="section-content">\n          ${projects.map(proj => `\n            <div class="item-block">\n              <div class="item-header">\n                <span class="item-title">${makeLink(proj.name, proj.nameLink)}${[proj.demoLink && `<a href="${proj.demoLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[Live Demo]</a>`, proj.docLink && `<a href="${proj.docLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[Docs]</a>`, proj.videoLink && `<a href="${proj.videoLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[Video]</a>`, proj.gitLink && `<a href="${proj.gitLink}" style="font-size:9pt; margin-left:6px; font-weight:normal; color:${theme.color}; text-decoration:none;">[GitHub]</a>`].filter(Boolean).slice(0, 2).join('')} | <span style="font-weight:normal">${makeLink(proj.role, proj.roleLink)}</span></span>\n              </div>\n              <div class="item-tech">${makeLink(proj.type, proj.typeLink)} | ${makeLink(proj.techStack, proj.techStackLink)}</div>\n              <div class="item-desc">${formatContent(proj.summary, proj.summaryLink, theme.projectsBullets ?? true)}</div>\n            </div>\n          `).join('')}\n        </div>\n      ` : '',
          achievements: achievements && achievements.length > 0 ? `\n        <h2>Accomplishments</h2>\n        <div class="section-content">\n          <ul>\n            ${achievements.map(ach => `<li>${makeLink(ach.text, ach.link)}</li>`).join('')}\n          </ul>\n        </div>\n      ` : ''
        };
        
        return (theme.sectionOrder || ['summary', 'education', 'experience', 'skills', 'projects', 'achievements']).map(sec => sectionsHTML[sec]).join('');
      })()}
      </div>
    </body>
    </html>
  `;
}

export default function SavedResumesScreen({ user }) {
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteResumeId, setDeleteResumeId] = useState(null);
  const fetchResumes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'userResumes'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const resumes = [];
      querySnapshot.forEach((doc) => {
        resumes.push({ id: doc.id, ...doc.data() });
      });
      resumes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSavedResumes(resumes);
    } catch (error) {
      console.error("Error fetching resumes: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const executeDelete = async () => {
    const id = deleteResumeId;
    setDeleteResumeId(null);
    try {
      await deleteDoc(doc(db, 'userResumes', id));
      setSavedResumes(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting resume: ", error);
    }
  };

  const handleExportPDF = async (resumeData, theme) => {
    try {
      const html = generateATSResumeHTML(resumeData, false, theme);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      Alert.alert("Export Error", "Failed to generate PDF.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Your Confirmed Resumes</Text>
        {savedResumes.length === 0 ? (
          <Text style={styles.emptyText}>No saved resumes yet. Head over to the Builder to tailor and confirm one!</Text>
        ) : (
          savedResumes.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.roleName}>{item.roleName}</Text>
                  <Text style={styles.date}>Confirmed on: {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => setDeleteResumeId(item.id)} style={{ padding: 8 }}>
                  <Feather name="trash-2" size={20} color="#F87171" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.exportButton} onPress={() => handleExportPDF(item.resumeData, item.theme)}>
                <Feather name="download" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.exportButtonText}>Export ATS PDF</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Custom Delete Modal */}
      <Modal visible={!!deleteResumeId} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Resume</Text>
            <Text style={styles.modalMessage}>Are you sure you want to delete this saved resume?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDeleteResumeId(null)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={executeDelete} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 60 },
  header: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', marginBottom: 20 },
  emptyText: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  roleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4
  },
  date: {
    fontSize: 13,
    color: '#94A3B8'
  },
  exportButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E293B', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalMessage: { color: '#94A3B8', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 12 },
  modalCancelText: { color: '#94A3B8', fontWeight: '600' },
  modalConfirmBtn: { backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' }
});