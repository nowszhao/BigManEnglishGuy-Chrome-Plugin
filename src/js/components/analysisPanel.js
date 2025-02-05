class AnalysisPanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.currentTab = 'summary'; // 修改默认标签为总结
        this.analyzer = null; // 添加 analyzer 引用
        this.currentSubtitles = null; // 添加当前字幕引用
        this.currentVideoId = null; // 添加视频ID属性
    }

    createPanel() {
        // 查找 YouTube 右侧栏容器
        const secondaryInner = document.querySelector('#secondary-inner');
        if (!secondaryInner) {
            console.error('Secondary inner container not found');
            return;
        }

        const panel = document.createElement('div');
        panel.className = 'subtitle-analysis-panel';
        panel.innerHTML = `
            <div class="analysis-header">
                <h3>AI 字幕解析</h3>
                <button class="close-btn">×</button>
            </div>
            <div class="analysis-tabs">
                <button class="tab-btn active" data-tab="summary">总结</button>
                <button class="tab-btn" data-tab="words">词汇</button>
                <button class="tab-btn" data-tab="phrases">短语</button>
            </div>
            <div class="analysis-search">
                <input type="text" placeholder="在视频中搜索...">
            </div>
            <div class="analysis-content">
                <div class="loading-indicator" style="display: none;">
                    <div class="spinner"></div>
                    <span>正在分析字幕...</span>
                </div>
                <div class="analysis-results"></div>
            </div>
        `;

        // 将面板插入到右侧栏的第一个位置
        if (secondaryInner.firstChild) {
            secondaryInner.insertBefore(panel, secondaryInner.firstChild);
        } else {
            secondaryInner.appendChild(panel);
        }
        
        this.panel = panel;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 关闭按钮事件
        this.panel.querySelector('.close-btn').addEventListener('click', () => {
            this.hidePanel();
        });

        // 搜索框事件
        const searchInput = this.panel.querySelector('.analysis-search input');
        searchInput.addEventListener('input', (e) => {
            this.filterResults(e.target.value);
        });

        // 监听视频全屏变化
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });

        // 添加标签切换事件
        const tabBtns = this.panel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Add after setupEventListeners method
        this.setupAudioPlayback();
    }

    handleFullscreenChange() {
        if (document.fullscreenElement) {
            this.panel.style.display = 'none';
        } else {
            if (this.isVisible) {
                this.panel.style.display = 'flex';
            }
        }
    }

    showPanel() {
        if (!this.panel) {
            this.createPanel();
        }
        this.panel.classList.add('visible');
        this.isVisible = true;
    }

    hidePanel() {
        if (this.panel) {
            this.panel.classList.remove('visible');
            this.isVisible = false;
        }
    }

    setLoading(loading) {
        if (!this.panel) return;
        
        const loadingIndicator = this.panel.querySelector('.loading-indicator');
        const resultsContainer = this.panel.querySelector('.analysis-results');
        
        loadingIndicator.style.display = loading ? 'flex' : 'none';
        resultsContainer.style.display = loading ? 'none' : 'block';
    }

    renderResults(results) {
        if (!this.panel) return;

        const resultsContainer = this.panel.querySelector('.analysis-results');
        
        // 根据不同类型渲染不同的结果
        if (this.currentTab === 'summary') {
            resultsContainer.innerHTML = this.createSummaryCard(results);
        } else {
            resultsContainer.innerHTML = results.map(item => this.createAnalysisCard(item)).join('');
            // Setup audio playback after rendering cards
            this.setupAudioPlayback();
        }
    }

    createAnalysisCard(item) {
        return `
            <div class="analysis-card">
                <div class="card-header">
                    <div class="expression-container">
                        <span class="expression">${item.expression}</span>
                        <button class="play-audio-btn" data-text="${item.expression}">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="tags">
                        <span class="tag type">${item.type}</span>
                        <span class="tag difficulty">${item.difficulty}</span>
                        <span class="tag speech">${item.part_of_speech}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="phonetic">${item.phonetic}</div>
                    <div class="meaning">${item.chinese_meaning}</div>
                    <div class="memory-method">
                        <strong>记忆方法：</strong>
                        <p>${item.memory_method}</p>
                    </div>
                    <div class="source">
                        <strong>出处：</strong>
                        <p>${item.source_sentence}</p>
                        <p class="translation">${item.source_translation}</p>
                    </div>
                </div>
            </div>
        `;
    }

    createSummaryCard(content) {
        try {
            // 解析 JSON 内容
            const data = typeof content === 'string' ? JSON.parse(content) : content;
            
            let html = '<div class="summary-card">';
            
            // 添加总结部分
            if (data.Summary) {
                html += `
                    <div class="summary-section">
                        <h4 class="summary-title">总结</h4>
                        <p class="summary-text">${data.Summary}</p>
                    </div>
                `;
            }
            
            // 添加观点部分
            if (data.Viewpoints && data.Viewpoints.length > 0) {
                html += `
                    <div class="viewpoints-section">
                        <h4 class="summary-title">观点</h4>
                        ${data.Viewpoints.map((point, index) => `
                            <div class="viewpoint-item">
                                <h5 class="viewpoint-title">${index + 1}. ${point.Viewpoint}</h5>
                                ${point.Argument.map(arg => `
                                    <div class="argument-item">
                                        <p class="argument-text">${arg}</p>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            html += '</div>';
            return html;
        } catch (error) {
            console.error('Error parsing summary content:', error);
            return `
                <div class="summary-card">
                    <div class="summary-error">
                        <p>解析内容时出现错误，请重试</p>
                    </div>
                </div>
            `;
        }
    }

    filterResults(searchText) {
        if (!searchText) {
            // 如果搜索框为空,显示所有结果
            this.panel.querySelectorAll('.analysis-card').forEach(card => {
                card.style.display = 'block';
            });
            return;
        }

        // 过滤结果
        this.panel.querySelectorAll('.analysis-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(searchText.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    switchTab(tab) {
        // 更新标签状态
        const tabBtns = this.panel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        this.currentTab = tab;
        // 触发重新分析
        this.triggerAnalysis();
    }

    async triggerAnalysis() {
        if (!this.analyzer || !this.currentSubtitles || !this.currentVideoId) {
            console.error('Analyzer, subtitles, or video ID not set');
            return;
        }

        this.setLoading(true);

        try {
            const results = await this.analyzer.analyzeSubtitles(
                this.currentSubtitles, 
                this.currentTab,
                this.currentVideoId
            );
            
            if (results) {
                this.renderResults(results);
            } else {
                throw new Error('Analysis failed');
            }
        } catch (error) {
            console.error('Failed to analyze subtitles:', error);
            this.renderResults([{
                type: 'Error',
                expression: '分析失败',
                difficulty: 'N/A',
                part_of_speech: 'N/A',
                phonetic: 'N/A',
                chinese_meaning: '请稍后重试',
                memory_method: '',
                source_sentence: '',
                source_translation: ''
            }]);
        } finally {
            this.setLoading(false);
        }
    }

    // 添加设置方法
    setAnalyzer(analyzer) {
        this.analyzer = analyzer;
    }

    setSubtitles(subtitles) {
        this.currentSubtitles = subtitles;
    }

    setupAudioPlayback() {
        if (!this.panel) return;
        
        this.panel.addEventListener('click', (e) => {
            // 阻止事件冒泡
            e.stopPropagation();
            
            const playButton = e.target.closest('.play-audio-btn');
            if (!playButton) return;

            // 如果按钮正在加载状态，不要重复播放
            if (playButton.classList.contains('loading')) return;

            const text = playButton.dataset.text;
            if (!text) return;

            const audio = new Audio(
                `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2&rate=6`
            );
            
            // Add loading state
            playButton.classList.add('loading');
            
            audio.onloadeddata = () => {
                playButton.classList.remove('loading');
            };
            
            audio.onerror = () => {
                playButton.classList.remove('loading');
                console.error('Failed to load audio');
            };
            
            audio.play();
        });
    }

    // 添加设置视频ID的方法
    setVideoId(videoId) {
        this.currentVideoId = videoId;
    }
}

export default AnalysisPanel; 