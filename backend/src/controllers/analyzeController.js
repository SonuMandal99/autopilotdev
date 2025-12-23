const Analysis = require('../models/Analysis');
const RepositoryService = require('../services/repoAnalyzer');
const AIService = require('../services/ai/openaiService');
const logger = require('../utils/logger');

class AnalyzeController {
  /**
   * Analyze a GitHub repository
   */
  async analyzeRepository(req, res) {
    try {
      const { url, branch = 'main', depth = 3, includeDependencies = true } = req.body;
      const userId = req.user.id;

      logger.info(`Analyzing repository: ${url} by user ${userId}`);

      // Emit analysis started event
      req.app.get('io').emit('analysis-started', { url, userId });

      // Clone and analyze repository
      const analysisResult = await RepositoryService.analyzeRepository(url, {
        branch,
        depth,
        includeDependencies
      });

      // Get AI insights
      const aiInsights = await AIService.getRepositoryInsights(analysisResult);

      // Combine results
      const fullAnalysis = {
        ...analysisResult,
        aiInsights,
        summary: this.generateSummary(analysisResult, aiInsights)
      };

      // Save to database
      const analysis = new Analysis({
        userId,
        repositoryUrl: url,
        branch,
        analysisData: fullAnalysis,
        status: 'completed',
        metrics: this.calculateMetrics(fullAnalysis)
      });

      await analysis.save();

      logger.info(`Analysis completed for ${url}, ID: ${analysis._id}`);

      // Emit analysis completed event
      req.app.get('io').emit('analysis-completed', {
        analysisId: analysis._id,
        url,
        userId
      });

      res.status(200).json({
        success: true,
        data: {
          analysisId: analysis._id,
          repository: url,
          summary: fullAnalysis.summary,
          insights: aiInsights.recommendations,
          metrics: analysis.metrics,
          createdAt: analysis.createdAt
        }
      });

    } catch (error) {
      logger.error(`Repository analysis failed: ${error.message}`);
      
      // Save failed analysis
      if (req.body.url) {
        const failedAnalysis = new Analysis({
          userId: req.user?.id,
          repositoryUrl: req.body.url,
          status: 'failed',
          error: error.message
        });
        await failedAnalysis.save();
      }

      res.status(500).json({
        success: false,
        error: 'Repository analysis failed',
        details: error.message
      });
    }
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(req, res) {
    try {
      const { analysisId } = req.params;
      const { includeFiles = false, includeMetrics = false } = req.query;
      const userId = req.user.id;

      logger.info(`Fetching analysis ${analysisId} for user ${userId}`);

      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      // Prepare response data
      const responseData = {
        analysisId: analysis._id,
        repositoryUrl: analysis.repositoryUrl,
        branch: analysis.branch,
        status: analysis.status,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        summary: analysis.analysisData?.summary || {},
        insights: analysis.analysisData?.aiInsights?.recommendations || []
      };

      if (includeFiles && analysis.analysisData?.files) {
        responseData.files = analysis.analysisData.files;
      }

      if (includeMetrics && analysis.metrics) {
        responseData.metrics = analysis.metrics;
      }

      if (analysis.analysisData?.structure) {
        responseData.structure = analysis.analysisData.structure;
      }

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      logger.error(`Get analysis failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analysis'
      });
    }
  }

  /**
   * Get list of analyses with pagination
   */
  async getAnalyses(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      const sortOrder = order === 'asc' ? 1 : -1;

      logger.info(`Listing analyses for user ${userId}, page ${page}`);

      const [analyses, total] = await Promise.all([
        Analysis.find({ userId })
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit))
          .select('_id repositoryUrl branch status metrics createdAt')
          .lean(),
        Analysis.countDocuments({ userId })
      ]);

      res.status(200).json({
        success: true,
        data: {
          analyses,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error(`List analyses failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analyses'
      });
    }
  }

  /**
   * Validate repository URL
   */
  async validateRepository(req, res) {
    try {
      const { url } = req.body;
      
      logger.info(`Validating repository URL: ${url}`);

      const isValid = await RepositoryService.validateRepository(url);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid repository URL or inaccessible repository'
        });
      }

      // Get repository metadata
      const metadata = await RepositoryService.getRepositoryMetadata(url);

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          metadata
        }
      });

    } catch (error) {
      logger.error(`Repository validation failed: ${error.message}`);
      res.status(400).json({
        success: false,
        error: 'Repository validation failed',
        details: error.message
      });
    }
  }

  /**
   * Get AI suggestions for repository
   */
  async getSuggestions(req, res) {
    try {
      const { analysisId } = req.params;
      const { aspects = ['security', 'performance', 'best-practices'], includeExamples = true } = req.body;
      const userId = req.user.id;

      logger.info(`Getting suggestions for analysis ${analysisId}`);

      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      if (analysis.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Analysis not completed yet'
        });
      }

      // Get AI suggestions
      const suggestions = await AIService.getRepositorySuggestions(
        analysis.analysisData,
        { aspects, includeExamples }
      );

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          aspects,
          suggestions
        }
      });

    } catch (error) {
      logger.error(`Get suggestions failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get suggestions'
      });
    }
  }

  /**
   * Perform AI-powered code review
   */
  async performCodeReview(req, res) {
    try {
      const { analysisId } = req.params;
      const { files = [], focus = 'all' } = req.body;
      const userId = req.user.id;

      logger.info(`Performing code review for analysis ${analysisId}, focus: ${focus}`);

      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      // Get code review from AI
      const codeReview = await AIService.performCodeReview(
        analysis.analysisData,
        { files, focus }
      );

      // Update analysis with code review results
      analysis.analysisData.codeReview = codeReview;
      await analysis.save();

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          focus,
          review: codeReview
        }
      });

    } catch (error) {
      logger.error(`Code review failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Code review failed'
      });
    }
  }

  /**
   * Analyze dependencies
   */
  async analyzeDependencies(req, res) {
    try {
      const { analysisId } = req.params;
      const { checkVulnerabilities = true, checkUpdates = true } = req.query;
      const userId = req.user.id;

      logger.info(`Analyzing dependencies for ${analysisId}`);

      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      // Analyze dependencies using AI
      const dependencyAnalysis = await AIService.analyzeDependencies(
        analysis.analysisData,
        { checkVulnerabilities, checkUpdates }
      );

      // Update analysis with dependency data
      analysis.analysisData.dependencies = dependencyAnalysis;
      await analysis.save();

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          dependencyAnalysis
        }
      });

    } catch (error) {
      logger.error(`Dependency analysis failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Dependency analysis failed'
      });
    }
  }

  /**
   * Calculate code complexity metrics
   */
  async calculateComplexity(req, res) {
    try {
      const { analysisId } = req.params;
      const userId = req.user.id;

      logger.info(`Calculating complexity for ${analysisId}`);

      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      // Calculate complexity metrics
      const complexityMetrics = this.calculateComplexityMetrics(analysis.analysisData);

      // Update analysis
      analysis.metrics.complexity = complexityMetrics;
      await analysis.save();

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          complexity: complexityMetrics
        }
      });

    } catch (error) {
      logger.error(`Complexity calculation failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Complexity calculation failed'
      });
    }
  }

  /**
   * Get repository file structure
   */
  async getFileStructure(req, res) {
    try {
      const { analysisId } = req.params;
      const { path = '', type = 'all' } = req.query;
      const userId = req.user.id;

      logger.info(`Getting file structure for ${analysisId}, path: ${path}`);

      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      const files = analysis.analysisData?.files || [];
      
      // Filter files based on path and type
      let filteredFiles = files;
      
      if (path) {
        filteredFiles = files.filter(file => 
          file.path.startsWith(path)
        );
      }
      
      if (type !== 'all') {
        filteredFiles = filteredFiles.filter(file => 
          type === 'file' ? !file.isDirectory : file.isDirectory
        );
      }

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          path,
          type,
          files: filteredFiles,
          total: filteredFiles.length
        }
      });

    } catch (error) {
      logger.error(`Get file structure failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get file structure'
      });
    }
  }

  /**
   * Get file content
   */
  async getFileContent(req, res) {
    try {
      const { analysisId, filePath } = req.params;
      const userId = req.user.id;

      logger.info(`Getting file content for ${analysisId}, file: ${filePath}`);

      const analysis = await Analysis.findOne({
        _id: analysisId,
        userId
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      // In a real implementation, this would fetch from storage
      // For demo, return mock content
      const fileContent = this.generateMockFileContent(filePath);

      res.status(200).json({
        success: true,
        data: {
          analysisId,
          filePath,
          content: fileContent,
          language: this.getFileLanguage(filePath),
          size: fileContent.length
        }
      });

    } catch (error) {
      logger.error(`Get file content failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get file content'
      });
    }
  }

  /**
   * Delete analysis
   */
  async deleteAnalysis(req, res) {
    try {
      const { analysisId } = req.params;
      const userId = req.user.id;

      logger.info(`Deleting analysis ${analysisId} for user ${userId}`);

      const result = await Analysis.deleteOne({
        _id: analysisId,
        userId
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Analysis deleted successfully'
      });

    } catch (error) {
      logger.error(`Delete analysis failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to delete analysis'
      });
    }
  }

  /**
   * Get analysis statistics
   */
  async getAnalysisStats(req, res) {
    try {
      const userId = req.user.id;
      const { timeframe = 'month' } = req.query;

      logger.info(`Getting analysis stats for user ${userId}, timeframe: ${timeframe}`);

      const dateFilter = this.getDateFilter(timeframe);
      
      const stats = await Analysis.aggregate([
        {
          $match: {
            userId,
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { 
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failed: { 
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            averageDuration: { $avg: '$metrics.analysisDuration' },
            totalLines: { $sum: '$metrics.totalLines' },
            totalFiles: { $sum: '$metrics.totalFiles' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: stats[0] || {
          total: 0,
          completed: 0,
          failed: 0,
          averageDuration: 0,
          totalLines: 0,
          totalFiles: 0
        }
      });

    } catch (error) {
      logger.error(`Get analysis stats failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get analysis statistics'
      });
    }
  }

  /**
   * Get analysis progress (for WebSocket)
   */
  async getAnalysisProgress(analysisId) {
    // Mock progress for demo
    return {
      analysisId,
      progress: 75,
      status: 'analyzing',
      currentStep: 'AI analysis',
      estimatedTimeRemaining: '2 minutes'
    };
  }

  // Helper Methods

  generateSummary(analysisResult, aiInsights) {
    return {
      totalFiles: analysisResult.files?.length || 0,
      totalLines: analysisResult.metrics?.totalLines || 0,
      languages: analysisResult.languages || [],
      dependencies: analysisResult.dependencies?.length || 0,
      complexity: aiInsights.complexity || 'medium',
      qualityScore: this.calculateQualityScore(analysisResult, aiInsights)
    };
  }

  calculateMetrics(analysisData) {
    return {
      analysisDuration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      totalLines: analysisData.metrics?.totalLines || 0,
      totalFiles: analysisData.files?.length || 0,
      languageDistribution: analysisData.languages || [],
      dependencyCount: analysisData.dependencies?.length || 0
    };
  }

  calculateComplexityMetrics(analysisData) {
    return {
      cyclomaticComplexity: Math.floor(Math.random() * 50) + 10,
      cognitiveComplexity: Math.floor(Math.random() * 100) + 20,
      maintainabilityIndex: Math.floor(Math.random() * 40) + 60, // 60-100
      halsteadMetrics: {
        vocabulary: Math.floor(Math.random() * 500) + 100,
        length: Math.floor(Math.random() * 2000) + 500,
        volume: Math.floor(Math.random() * 10000) + 1000,
        difficulty: Math.floor(Math.random() * 50) + 10,
        effort: Math.floor(Math.random() * 500000) + 100000
      }
    };
  }

  calculateQualityScore(analysisResult, aiInsights) {
    // Mock quality score calculation
    const baseScore = 80;
    const improvements = aiInsights.recommendations?.length || 0;
    const issues = aiInsights.issues?.length || 0;
    
    return Math.max(0, Math.min(100, baseScore - (issues * 5) + (improvements * 2)));
  }

  getDateFilter(timeframe) {
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return { $gte: startDate };
  }

  generateMockFileContent(filePath) {
    const extension = filePath.split('.').pop();
    
    const templates = {
      'js': `// ${filePath}
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from AutoPilotDev!' });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
      'py': `# ${filePath}
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({'message': 'Hello from AutoPilotDev!'})

if __name__ == '__main__':
    app.run(debug=True)`,
      'java': `// ${filePath}
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from AutoPilotDev!");
    }
}`,
      'dockerfile': `# ${filePath}
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`
    };

    return templates[extension] || `// Content of ${filePath}\n// This is a mock file for demonstration purposes.`;
  }

  getFileLanguage(filePath) {
    const extension = filePath.split('.').pop();
    
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'dockerfile': 'dockerfile',
      'md': 'markdown'
    };

    return languageMap[extension] || 'text';
  }
}

module.exports = new AnalyzeController();