import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Modal, Image, Linking } from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { loadLibraries, getHtml2Pdf, getPdfjsLib, getPdfLib } from '../pdfHelpers';

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
        body { font-family: 'Arial', Helvetica, sans-serif; color: #000; font-size: ${9.5 * fontScale}pt; line-height: ${1.2 * lhScale}; margin: 0; padding: 10mm; background: #e2e8f0; }
        
        /* Simulated A4 Paper for Web Preview */
        .a4-container { background: #fff; width: 210mm; max-width: 100%; min-height: 297mm; margin: 20px auto; padding: 10mm; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.15); overflow: hidden; }
        
        /* Remove simulation styles when actually printing to PDF */
        @media print { body { background: #fff; padding: 0; } .a4-container { width: 100%; min-height: auto; margin: 0; padding: 10mm; box-shadow: none; overflow: visible !important; } }

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
        
        .item-header { clear: both; overflow: hidden; margin-bottom: 2px; }
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
          skills: skills ? `\n        <h2>Skills</h2>\n        <div class="section-content">\n          ${makeLink(typeof skills === 'string' ? skills.replace(/\n/g, '<br>') : skills, skillsLink)}\n        </div>\n      ` : '',
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

const getDynamicStyles = (theme) => {
  const fontScale = theme?.fontSizeScale || 1;
  const lhScale = theme?.lineSpacingScale || 1;
  return {
    webPreviewName: { fontSize: 22 * fontScale, lineHeight: 22 * fontScale * lhScale },
    webPreviewMeta: { fontSize: 13 * fontScale, lineHeight: 13 * fontScale * lhScale },
    webPreviewLinkItem: { fontSize: 13 * fontScale, lineHeight: 13 * fontScale * lhScale },
    webPreviewHeading: { fontSize: 14 * fontScale, lineHeight: 14 * fontScale * lhScale },
    webPreviewStrong: { fontSize: 13 * fontScale, lineHeight: 13 * fontScale * lhScale },
    webPreviewMuted: { fontSize: 12 * fontScale, lineHeight: 12 * fontScale * lhScale },
    webPreviewBody: { fontSize: 13 * fontScale, lineHeight: 19 * fontScale * lhScale },
    webPreviewBullet: { fontSize: 13 * fontScale, lineHeight: 19 * fontScale * lhScale },
  };
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
};

const WebResumeContent = React.memo(({ finalResume, theme, showPhoto }) => {
  const dStyles = getDynamicStyles(theme);
  const getScoreLabel = (score) => String(score).includes('.') ? 'CGPA' : 'Percentage';
  const alignStyle = showPhoto && finalResume.personal?.photoURL ? 'left' : 'center';
  const defaultSectionOrder = ['summary', 'education', 'experience', 'skills', 'projects', 'achievements'];
  
  const webSections = {
    summary: finalResume.summary ? ( <View key="summary" style={styles.webPreviewSection}><Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Summary</Text>{renderWebPreviewText(finalResume.summary, false, dStyles)}</View> ) : null,
    education: finalResume.education?.length ? ( <View key="education" style={styles.webPreviewSection}><Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Education</Text>{finalResume.education.map((ed, idx) => (<View key={idx} style={styles.webPreviewItem}><View style={styles.webPreviewItemHeader}><Text style={[styles.webPreviewStrong, dStyles.webPreviewStrong]}>{ed.institution}</Text><Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{ed.duration}</Text></View><Text style={[styles.webPreviewBody, dStyles.webPreviewBody]}>{ed.course}</Text>{ed.score ? <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{getScoreLabel(ed.score)}: {ed.score}</Text> : null}</View>))}</View> ) : null,
    experience: finalResume.experience?.length ? ( <View key="experience" style={styles.webPreviewSection}><Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Work Experience</Text>{finalResume.experience.map((exp, idx) => (<View key={idx} style={styles.webPreviewItem}><View style={styles.webPreviewItemHeader}><Text style={[styles.webPreviewStrong, dStyles.webPreviewStrong]}>{[exp.company, exp.role].filter(Boolean).join(' | ')}</Text>{exp.duration ? <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{exp.duration}</Text> : null}</View>{renderWebPreviewText(exp.summary, theme?.experienceBullets ?? false, dStyles)}</View>))}</View> ) : null,
    skills: finalResume.skills ? ( <View key="skills" style={styles.webPreviewSection}><Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Skills</Text>{typeof finalResume.skills === 'string' ? finalResume.skills.split('\n').map((line, idx) => { const colonIdx = line.indexOf(':'); if (colonIdx !== -1) { return <Text key={idx} style={[styles.webPreviewBody, dStyles.webPreviewBody]}><Text style={{ fontWeight: 'bold' }}>{line.substring(0, colonIdx + 1)}</Text>{line.substring(colonIdx + 1)}</Text>; } return <Text key={idx} style={[styles.webPreviewBody, dStyles.webPreviewBody]}>{line}</Text>; }) : <Text style={[styles.webPreviewBody, dStyles.webPreviewBody]}>{finalResume.skills}</Text>}</View> ) : null,
    projects: finalResume.projects?.length ? ( <View key="projects" style={styles.webPreviewSection}><Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Projects</Text>{finalResume.projects.map((proj, idx) => { const topLinks = [proj.demoLink && { url: proj.demoLink, label: 'Live Demo' }, proj.docLink && { url: proj.docLink, label: 'Docs' }, proj.videoLink && { url: proj.videoLink, label: 'Video' }, proj.gitLink && { url: proj.gitLink, label: 'GitHub' }].filter(Boolean).slice(0, 2); return ( <View key={idx} style={styles.webPreviewItem}><View style={styles.webPreviewItemHeader}><View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', flex: 1 }}><Text style={[styles.webPreviewStrong, dStyles.webPreviewStrong]}>{proj.name}</Text>{topLinks.map((link, i) => <Text key={i} style={[styles.webPreviewLinkItem, dStyles.webPreviewLinkItem, { marginLeft: 8, fontSize: 11, fontWeight: 'normal' }]} onPress={() => Linking.openURL(ensureAbsoluteUrl(link.url))}>[{link.label}]</Text>)}</View>{proj.role ? <Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{proj.role}</Text> : null}</View><Text style={[styles.webPreviewMuted, dStyles.webPreviewMuted]}>{[proj.type, proj.techStack].filter(Boolean).join(' | ')}</Text>{renderWebPreviewText(proj.summary, theme?.projectsBullets ?? true, dStyles)}</View> ) })}</View> ) : null,
    achievements: finalResume.achievements?.length ? ( <View key="achievements" style={styles.webPreviewSection}><Text style={[styles.webPreviewHeading, dStyles.webPreviewHeading]}>Accomplishments</Text>{finalResume.achievements.map((ach, idx) => (<Text key={idx} style={[styles.webPreviewBullet, dStyles.webPreviewBullet]}>• {ach.text}</Text>))}</View> ) : null
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
      {(theme?.sectionOrder || defaultSectionOrder).map(sec => webSections[sec])}
    </View>
  );
});

export default function SavedResumesScreen({ user }) {
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteResumeId, setDeleteResumeId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [popupState, setPopupState] = useState({ visible: false, title: '', message: '', isError: false });
  
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

  const handleExportPDF = async (resumeData, theme, showPhoto = false) => {
    try {
      console.log('handleExportPDF called');

      // Load libraries if not already loaded
      if (!getHtml2Pdf() || !getPdfjsLib()) {
        console.log('Loading libraries...');
        await loadLibraries();
      }

      const html2pdf = getHtml2Pdf();
      const pdfjsLib = getPdfjsLib();

      const htmlContent = generateATSResumeHTML(resumeData, showPhoto, theme);
      console.log('HTML content generated, length:', htmlContent.length);
      
      if (Platform.OS === 'web') {
        const printContainer = document.createElement('div');
        printContainer.id = 'print-overlay-container';
        printContainer.style.position = 'fixed';
        printContainer.style.top = '0';
        printContainer.style.left = '0';
        printContainer.style.width = '100vw';
        printContainer.style.height = '100vh';
        printContainer.style.backgroundColor = '#1E293B';
        printContainer.style.zIndex = '99999';
        printContainer.style.display = 'flex';
        printContainer.style.flexDirection = 'column';

        const topBar = document.createElement('div');
        topBar.style.display = 'flex';
        topBar.style.justifyContent = 'space-between';
        topBar.style.alignItems = 'center';
        topBar.style.padding = '16px 24px';
        topBar.style.backgroundColor = '#1E293B';
        topBar.style.color = '#fff';
        topBar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        const title = document.createElement('h2');
        title.innerText = 'PDF Preview';
        title.style.margin = '0';
        title.style.fontSize = '18px';
        title.style.fontWeight = 'bold';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';

        const downloadBtn = document.createElement('button');
        downloadBtn.innerText = '⬇ Download PDF';
        downloadBtn.style.padding = '10px 20px';
        downloadBtn.style.backgroundColor = '#10B981';
        downloadBtn.style.color = '#fff';
        downloadBtn.style.border = 'none';
        downloadBtn.style.borderRadius = '8px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.fontWeight = 'bold';

        const backBtn = document.createElement('button');
        backBtn.innerText = '← Back';
        backBtn.style.padding = '8px 16px';
        backBtn.style.backgroundColor = '#334155';
        backBtn.style.color = '#fff';
        backBtn.style.border = 'none';
        backBtn.style.borderRadius = '8px';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontWeight = 'bold';
        
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
        previewContainer.style.backgroundColor = '#f8fafc';
        previewContainer.style.display = 'flex';
        previewContainer.style.flexDirection = 'column';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.gap = '20px';

        const loadingText = document.createElement('div');
        loadingText.innerText = 'Generating PDF preview...';
        loadingText.style.fontSize = '16px';
        loadingText.style.color = '#64748b';
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
        const userName = resumeData.personal?.name ? resumeData.personal.name.replace(/\s+/g, '-') : 'Resume';
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

          const updateDeleteBtnState = () => {
            if (deletedPages.has(currentPage)) {
              deleteBtn.innerText = '↩️ Restore Current Page';
              deleteBtn.style.backgroundColor = '#F59E0B'; // Amber
            } else {
              deleteBtn.innerText = '🗑️ Delete Current Page';
              deleteBtn.style.backgroundColor = '#EF4444'; // Red
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
          deleteBtn.style.padding = '8px 16px';
          deleteBtn.style.color = '#fff';
          deleteBtn.style.border = 'none';
          deleteBtn.style.borderRadius = '8px';
          deleteBtn.style.cursor = 'pointer';
          deleteBtn.style.fontWeight = 'bold';
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

          // Insert delete button before download button
          buttonContainer.insertBefore(deleteBtn, downloadBtn);
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

            previewContainer.appendChild(canvas);
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
            prevBtn.style.padding = '8px 16px';
            prevBtn.style.backgroundColor = '#3B82F6';
            prevBtn.style.color = '#fff';
            prevBtn.style.border = 'none';
            prevBtn.style.borderRadius = '6px';
            prevBtn.style.cursor = 'pointer';
            prevBtn.disabled = true;

            const pageInfo = document.createElement('span');
            pageInfo.innerText = `Page 1 of ${numPages}`;
            pageInfo.style.fontSize = '14px';
            pageInfo.style.fontWeight = 'bold';
            pageInfo.style.color = '#374151';

            const nextBtn = document.createElement('button');
            nextBtn.innerText = 'Next →';
            nextBtn.style.padding = '8px 16px';
            nextBtn.style.backgroundColor = '#3B82F6';
            nextBtn.style.color = '#fff';
            nextBtn.style.border = 'none';
            nextBtn.style.borderRadius = '6px';
            nextBtn.style.cursor = 'pointer';

            navContainer.appendChild(prevBtn);
            navContainer.appendChild(pageInfo);
            navContainer.appendChild(nextBtn);
            previewContainer.appendChild(navContainer);

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
              <h3 style="margin: 0 0 16px 0; color: #ef4444;">Failed to generate PDF preview</h3>
              <p style="margin: 0 0 16px 0; color: #64748b;">${err.message || 'Unknown error occurred'}</p>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Check the browser console for more details.</p>
              <div style="margin-top: 20px;">
                <button onclick="location.reload()" style="margin-right: 10px; padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
                <button id="show-html-fallback" style="padding: 8px 16px; background: #10B981; color: white; border: none; border-radius: 6px; cursor: pointer;">Show HTML Preview</button>
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
                    <div style="margin-bottom: 20px; text-align: center; color: #64748b; font-size: 14px;">
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
      setPopupState({ visible: true, title: "Export Error", message: "Failed to generate PDF.", isError: true });
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
              <TouchableOpacity 
                style={styles.cardHeader}
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.roleName}>{item.roleName}</Text>
                  <Text style={styles.date}>Confirmed on: {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setDeleteResumeId(item.id)} style={{ padding: 8 }}>
                    <Feather name="trash-2" size={20} color="#F87171" />
                  </TouchableOpacity>
                  <Feather name={expandedId === item.id ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" style={{ marginLeft: 8 }} />
                </View>
              </TouchableOpacity>
              {expandedId === item.id && (
                <View style={styles.expandedPanel}>
                  <View style={styles.webPreviewShell}>
                    <ScrollView style={styles.webPreviewScroller} contentContainerStyle={styles.webPreviewContent} nestedScrollEnabled={true}>
                      <View style={styles.webA4Sheet}><WebResumeContent finalResume={item.resumeData} theme={item.theme || {}} showPhoto={false} /></View>
                    </ScrollView>
                  </View>
                  <TouchableOpacity style={[styles.exportButton, { marginTop: 16 }]} onPress={() => handleExportPDF(item.resumeData, item.theme, false)}>
                    <Feather name="download" size={16} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.exportButtonText}>Export ATS PDF</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  expandedPanel: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 16, marginTop: 16 },
  webPreviewShell: { height: 400, width: '100%', overflow: 'hidden', borderRadius: 8, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0F172A' },
  webPreviewScroller: { height: '100%', maxHeight: '100%', backgroundColor: '#0F172A' },
  webPreviewContent: { padding: 12, minHeight: '100%' },
  webA4Sheet: { alignSelf: 'center', width: '100%', maxWidth: 760, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  webCompactCard: { paddingVertical: 24, paddingHorizontal: 24 },
  webPreviewName: { fontSize: 22, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 6 },
  webPreviewMeta: { fontSize: 13, color: '#475569', textAlign: 'center', marginBottom: 4 },
  webPreviewLinkItem: { fontSize: 13, color: '#2563EB', textDecorationLine: 'underline' },
  webPreviewSection: { marginBottom: 10 },
  webPreviewHeading: { fontSize: 14, fontWeight: 'bold', color: '#000', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 4, textTransform: 'uppercase' },
  webPreviewItem: { marginBottom: 8 },
  webPreviewItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  webPreviewStrong: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 2 },
  webPreviewMuted: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  webPreviewBody: { fontSize: 13, color: '#334155', lineHeight: 19 },
  webPreviewBullet: { fontSize: 13, color: '#334155', lineHeight: 19, marginBottom: 4 },
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
});