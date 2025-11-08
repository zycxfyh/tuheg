import { Injectable } from '@nestjs/common';
import { AiProviderService } from '../plugins/ai-provider.service';
import { ModelRouterService } from '../plugins/model-router.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface MedicalDocument {
  type: 'discharge_summary' | 'progress_note' | 'consultation_note' | 'procedure_note';
  patientId: string;
  providerId: string;
  content: string;
  metadata: {
    encounterDate: Date;
    facility: string;
    department: string;
    chiefComplaint: string;
    assessment: string;
    plan: string;
  };
}

export interface PatientEducationMaterial {
  condition: string;
  patientId: string;
  language: string;
  readingLevel: 'basic' | 'intermediate' | 'advanced';
  content: {
    overview: string;
    symptoms: string[];
    treatment: string;
    lifestyle: string[];
    whenToSeekHelp: string[];
    resources: string[];
  };
  metadata: {
    createdDate: Date;
    lastReviewed: Date;
    source: string;
    evidenceLevel: string;
  };
}

export interface ClinicalDecisionSupport {
  patientId: string;
  chiefComplaint: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  symptoms: string[];
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];

  recommendations: {
    differentialDiagnosis: Array<{
      condition: string;
      probability: number;
      reasoning: string;
      urgency: 'routine' | 'urgent' | 'emergency';
    }>;
    diagnosticTests: Array<{
      test: string;
      rationale: string;
      priority: 'low' | 'medium' | 'high';
    }>;
    treatmentOptions: Array<{
      treatment: string;
      evidenceLevel: string;
      risks: string[];
      benefits: string[];
    }>;
    followUp: {
      timeframe: string;
      instructions: string[];
    };
  };
}

@Injectable()
export class HealthcareService {
  constructor(
    private aiProviderService: AiProviderService,
    private modelRouterService: ModelRouterService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== 医疗文档处理 ====================

  /**
   * 生成出院总结
   */
  async generateDischargeSummary(request: {
    patientId: string;
    admissionDate: Date;
    dischargeDate: Date;
    admittingDiagnosis: string;
    dischargeDiagnosis: string;
    procedures: string[];
    medications: string[];
    followUpInstructions: string;
    providerId: string;
  }): Promise<MedicalDocument> {
    const prompt = `Generate a comprehensive discharge summary:

Patient ID: ${request.patientId}
Admission Date: ${request.admissionDate.toISOString().split('T')[0]}
Discharge Date: ${request.dischargeDate.toISOString().split('T')[0]}

Admitting Diagnosis: ${request.admittingDiagnosis}
Discharge Diagnosis: ${request.dischargeDiagnosis}

Procedures Performed: ${request.procedures.join(', ')}
Medications at Discharge: ${request.medications.join(', ')}
Follow-up Instructions: ${request.followUpInstructions}

Format as a professional medical discharge summary with all required sections.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['medical-documentation', 'clinical-summarization'],
      priority: 'performance',
      context: { documentType: 'discharge_summary', sensitivity: 'high' }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const metadata = this.extractDocumentMetadata(content);

    const document: MedicalDocument = {
      type: 'discharge_summary',
      patientId: request.patientId,
      providerId: request.providerId,
      content,
      metadata: {
        encounterDate: request.dischargeDate,
        facility: 'General Hospital',
        department: 'Internal Medicine',
        ...metadata
      }
    };

    this.eventEmitter.emit('healthcare.documentGenerated', {
      type: 'discharge_summary',
      document
    });

    return document;
  }

  /**
   * 生成进展记录
   */
  async generateProgressNote(request: {
    patientId: string;
    encounterDate: Date;
    subjective: string; // 主观症状
    objective: string; // 客观检查
    assessment: string; // 评估
    plan: string; // 计划
    providerId: string;
  }): Promise<MedicalDocument> {
    const prompt = `Generate a SOAP progress note:

Subjective: ${request.subjective}
Objective: ${request.objective}
Assessment: ${request.assessment}
Plan: ${request.plan}

Format as a professional SOAP note.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['medical-documentation', 'clinical-note-taking'],
      priority: 'performance'
    });

    const content = await this.generateContent(prompt, routingResult.model.id);

    return {
      type: 'progress_note',
      patientId: request.patientId,
      providerId: request.providerId,
      content,
      metadata: {
        encounterDate: request.encounterDate,
        facility: 'General Hospital',
        department: 'Internal Medicine',
        chiefComplaint: request.subjective,
        assessment: request.assessment,
        plan: request.plan
      }
    };
  }

  /**
   * 总结医疗文档
   */
  async summarizeMedicalDocument(document: MedicalDocument): Promise<{
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    followUpNeeds: string[];
  }> {
    const prompt = `Summarize this medical document:

Type: ${document.type}
Content: ${document.content}

Provide:
1. Brief summary
2. Key clinical points
3. Action items for healthcare providers
4. Follow-up needs or recommendations`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['medical-summarization', 'clinical-analysis'],
      priority: 'performance'
    });

    const summaryContent = await this.generateContent(prompt, routingResult.model.id);

    return this.parseMedicalSummary(summaryContent);
  }

  // ==================== 患者教育材料 ====================

  /**
   * 生成患者教育材料
   */
  async generatePatientEducation(request: {
    condition: string;
    patientId: string;
    language: string;
    readingLevel: 'basic' | 'intermediate' | 'advanced';
    includeImages: boolean;
    culturalContext?: string;
  }): Promise<PatientEducationMaterial> {
    const readingLevelPrompts = {
      basic: 'Use simple words and short sentences. Explain medical terms.',
      intermediate: 'Use everyday language with some medical terms explained.',
      advanced: 'Use medical terminology with detailed explanations.'
    };

    const prompt = `Create patient education material for ${request.condition}:

Language: ${request.language}
Reading Level: ${request.readingLevel}
${request.culturalContext ? `Cultural Context: ${request.culturalContext}` : ''}

${readingLevelPrompts[request.readingLevel]}

Include:
- Condition overview
- Common symptoms
- Treatment options
- Lifestyle recommendations
- When to seek medical help
- Available resources

Make it empathetic, clear, and actionable.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['patient-education', 'health-communication'],
      priority: 'performance',
      context: {
        language: request.language,
        readingLevel: request.readingLevel,
        medicalDomain: true
      }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const structuredContent = this.parsePatientEducationContent(content);

    const material: PatientEducationMaterial = {
      condition: request.condition,
      patientId: request.patientId,
      language: request.language,
      readingLevel: request.readingLevel,
      content: structuredContent,
      metadata: {
        createdDate: new Date(),
        lastReviewed: new Date(),
        source: 'AI-generated with clinical oversight',
        evidenceLevel: 'Based on current medical guidelines'
      }
    };

    return material;
  }

  /**
   * 个性化患者教育
   */
  async personalizePatientEducation(
    baseMaterial: PatientEducationMaterial,
    patientContext: {
      age: number;
      gender: string;
      comorbidities: string[];
      medications: string[];
      healthLiteracy: 'low' | 'medium' | 'high';
      preferences: string[];
    }
  ): Promise<PatientEducationMaterial> {
    const prompt = `Personalize this patient education material:

Base Content: ${JSON.stringify(baseMaterial.content)}
Patient Context: Age ${patientContext.age}, ${patientContext.gender}
Comorbidities: ${patientContext.comorbidities.join(', ')}
Medications: ${patientContext.medications.join(', ')}
Health Literacy: ${patientContext.healthLiteracy}
Preferences: ${patientContext.preferences.join(', ')}

Adapt the content to be more relevant and understandable for this specific patient.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['personalization', 'patient-communication'],
      priority: 'performance'
    });

    const personalizedContent = await this.generateContent(prompt, routingResult.model.id);
    const structuredContent = this.parsePatientEducationContent(personalizedContent);

    return {
      ...baseMaterial,
      content: structuredContent
    };
  }

  // ==================== 临床决策支持 ====================

  /**
   * 生成临床决策支持
   */
  async generateClinicalDecisionSupport(
    patientData: Omit<ClinicalDecisionSupport, 'recommendations'>
  ): Promise<ClinicalDecisionSupport> {
    const prompt = `Provide clinical decision support for this patient:

Chief Complaint: ${patientData.chiefComplaint}

Vital Signs:
- Blood Pressure: ${patientData.vitalSigns.bloodPressure}
- Heart Rate: ${patientData.vitalSigns.heartRate} bpm
- Temperature: ${patientData.vitalSigns.temperature}°C
- Oxygen Saturation: ${patientData.vitalSigns.oxygenSaturation}%

Symptoms: ${patientData.symptoms.join(', ')}
Medical History: ${patientData.medicalHistory.join(', ')}
Current Medications: ${patientData.currentMedications.join(', ')}
Allergies: ${patientData.allergies.join(', ')}

Provide:
1. Differential diagnosis with probabilities
2. Recommended diagnostic tests
3. Treatment options with evidence levels
4. Follow-up recommendations

This is for informational purposes only and should not replace clinical judgment.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['clinical-decision-support', 'medical-diagnosis'],
      priority: 'performance',
      context: { medicalDomain: true, criticalDecision: true }
    });

    const recommendations = await this.generateContent(prompt, routingResult.model.id);
    const parsedRecommendations = this.parseClinicalRecommendations(recommendations);

    return {
      ...patientData,
      recommendations: parsedRecommendations
    };
  }

  /**
   * 药物相互作用检查
   */
  async checkDrugInteractions(medications: string[]): Promise<{
    interactions: Array<{
      drugs: string[];
      severity: 'minor' | 'moderate' | 'major';
      description: string;
      recommendation: string;
    }>;
    riskLevel: 'low' | 'moderate' | 'high';
  }> {
    if (medications.length < 2) {
      return { interactions: [], riskLevel: 'low' };
    }

    const prompt = `Check for drug interactions among these medications:

Medications: ${medications.join(', ')}

For each potential interaction, provide:
- Involved drugs
- Severity level
- Description of interaction
- Clinical recommendation

Format as a structured list.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['drug-interaction-checking', 'pharmacology'],
      priority: 'performance',
      context: { medicalDomain: true }
    });

    const analysis = await this.generateContent(prompt, routingResult.model.id);
    const parsedInteractions = this.parseDrugInteractions(analysis);

    // 计算整体风险水平
    const riskLevels = parsedInteractions.map(i => {
      switch (i.severity) {
        case 'major': return 3;
        case 'moderate': return 2;
        case 'minor': return 1;
        default: return 0;
      }
    });

    const maxRisk = Math.max(...riskLevels);
    const riskLevel = maxRisk >= 3 ? 'high' : maxRisk >= 2 ? 'moderate' : 'low';

    return {
      interactions: parsedInteractions,
      riskLevel: riskLevel as any
    };
  }

  // ==================== 医疗数据分析 ====================

  /**
   * 分析患者趋势
   */
  async analyzePatientTrends(
    patientId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    vitalSignsTrend: any;
    symptomPatterns: any;
    medicationAdherence: any;
    riskFactors: string[];
    recommendations: string[];
  }> {
    // 这里应该从患者记录中提取数据
    // 暂时返回模拟分析结果

    return {
      vitalSignsTrend: {
        bloodPressure: 'stable',
        heartRate: 'improving',
        weight: 'trending_down'
      },
      symptomPatterns: {
        primarySymptoms: ['fatigue', 'shortness_of_breath'],
        frequency: 'decreasing',
        severity: 'moderate'
      },
      medicationAdherence: {
        overall: 85,
        byMedication: {
          'Lisinopril': 90,
          'Metformin': 80,
          'Atorvastatin': 95
        }
      },
      riskFactors: [
        'Family history of cardiovascular disease',
        'Sedentary lifestyle',
        'Elevated BMI'
      ],
      recommendations: [
        'Continue current medication regimen',
        'Increase physical activity',
        'Monitor blood pressure weekly',
        'Follow-up appointment in 3 months'
      ]
    };
  }

  /**
   * 生成医疗报告
   */
  async generateMedicalReport(request: {
    patientId: string;
    reportType: 'annual' | 'specialty' | 'discharge' | 'consultation';
    timeRange: { start: Date; end: Date };
    includeCharts: boolean;
    recipient: 'patient' | 'provider' | 'specialist';
  }): Promise<{
    title: string;
    summary: string;
    sections: Array<{
      title: string;
      content: string;
      charts?: any[];
    }>;
    recommendations: string[];
    metadata: {
      generatedDate: Date;
      dataSource: string;
      confidentiality: string;
    };
  }> {
    const prompt = `Generate a ${request.reportType} medical report for patient ${request.patientId}:

Time Range: ${request.timeRange.start.toISOString().split('T')[0]} to ${request.timeRange.end.toISOString().split('T')[0]}
Recipient: ${request.recipient}
Include Charts: ${request.includeCharts}

Structure the report with appropriate sections for the recipient type.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['medical-report-generation', 'clinical-documentation'],
      priority: 'performance',
      context: { reportType: request.reportType, recipient: request.recipient }
    });

    const reportContent = await this.generateContent(prompt, routingResult.model.id);
    const structuredReport = this.parseMedicalReport(reportContent);

    return {
      ...structuredReport,
      metadata: {
        generatedDate: new Date(),
        dataSource: 'Electronic Health Record System',
        confidentiality: 'HIPAA Protected Health Information'
      }
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 生成内容
   */
  private async generateContent(prompt: string, modelId: string): Promise<string> {
    // 这里应该调用实际的AI模型API
    // 暂时返回模拟内容
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `Generated healthcare content based on prompt: ${prompt.substring(0, 100)}...`;
  }

  /**
   * 提取文档元数据
   */
  private extractDocumentMetadata(content: string): any {
    // 简化的元数据提取逻辑
    return {
      chiefComplaint: 'Patient presented with...',
      assessment: 'Diagnosis and assessment...',
      plan: 'Treatment plan...'
    };
  }

  /**
   * 解析医疗总结
   */
  private parseMedicalSummary(content: string): any {
    // 简化的解析逻辑
    return {
      summary: 'Medical document summary',
      keyPoints: ['Key point 1', 'Key point 2'],
      actionItems: ['Action 1', 'Action 2'],
      followUpNeeds: ['Follow-up 1']
    };
  }

  /**
   * 解析患者教育内容
   */
  private parsePatientEducationContent(content: string): any {
    // 简化的解析逻辑
    return {
      overview: 'Condition overview',
      symptoms: ['Symptom 1', 'Symptom 2'],
      treatment: 'Treatment information',
      lifestyle: ['Lifestyle recommendation 1'],
      whenToSeekHelp: ['When to seek help'],
      resources: ['Resource 1']
    };
  }

  /**
   * 解析临床推荐
   */
  private parseClinicalRecommendations(content: string): any {
    // 简化的解析逻辑
    return {
      differentialDiagnosis: [
        {
          condition: 'Condition 1',
          probability: 0.7,
          reasoning: 'Reasoning...',
          urgency: 'routine'
        }
      ],
      diagnosticTests: [
        {
          test: 'Test 1',
          rationale: 'Rationale...',
          priority: 'medium'
        }
      ],
      treatmentOptions: [
        {
          treatment: 'Treatment 1',
          evidenceLevel: 'Level A',
          risks: ['Risk 1'],
          benefits: ['Benefit 1']
        }
      ],
      followUp: {
        timeframe: '1 week',
        instructions: ['Instruction 1']
      }
    };
  }

  /**
   * 解析药物相互作用
   */
  private parseDrugInteractions(content: string): any[] {
    // 简化的解析逻辑
    return [
      {
        drugs: ['Drug A', 'Drug B'],
        severity: 'moderate',
        description: 'Interaction description',
        recommendation: 'Recommendation'
      }
    ];
  }

  /**
   * 解析医疗报告
   */
  private parseMedicalReport(content: string): any {
    // 简化的解析逻辑
    return {
      title: 'Medical Report',
      summary: 'Report summary',
      sections: [
        {
          title: 'Section 1',
          content: 'Section content'
        }
      ],
      recommendations: ['Recommendation 1']
    };
  }
}
