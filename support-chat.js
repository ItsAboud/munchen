// شات الدعم الفني بالذكاء الاصطناعي المحسن
class SupportChat {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.failedAttempts = 0;
        this.maxFailedAttempts = 3;
        this.isTransferredToHuman = false;
        this.userContext = {
            askedAbout: [],
            preferredLanguage: 'ar',
            sessionStart: new Date(),
            conversationHistory: [],
            userPreferences: {},
            satisfactionScore: 0,
            lastInteractionTime: new Date()
        };
        this.init();
    }

    init() {
        this.loadConversationData();
        this.createChatElements();
        this.bindEvents();
        this.addWelcomeMessage();
    }

    createChatElements() {
        // إنشاء زر الشات العائم
        const chatFab = document.createElement('div');
        chatFab.className = 'support-chat-fab pulse';
        chatFab.id = 'support-chat-fab';
        chatFab.innerHTML = '<i class="fas fa-headset"></i>';
        chatFab.title = 'الدعم الفني - تحدث مع الذكاء الاصطناعي';
        document.body.appendChild(chatFab);

        // إنشاء نافذة الشات
        const chatWindow = document.createElement('div');
        chatWindow.className = 'support-chat-window';
        chatWindow.id = 'support-chat-window';
        chatWindow.innerHTML = `
            <div class="support-chat-header">
                <div>
                    <i class="fas fa-robot" style="margin-left: 0.5rem;"></i>
                    الدعم الفني - AI
                </div>
                <button class="support-chat-close" id="support-chat-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="support-chat-messages" id="support-chat-messages"></div>
            <div class="support-chat-input-area">
                <input type="text" class="support-chat-input" id="support-chat-input" 
                       placeholder="اكتب رسالتك هنا..." maxlength="500">
                <button class="support-chat-send" id="support-chat-send">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        document.body.appendChild(chatWindow);

        // حفظ المراجع
        this.chatFab = chatFab;
        this.chatWindow = chatWindow;
        this.messagesContainer = document.getElementById('support-chat-messages');
        this.chatInput = document.getElementById('support-chat-input');
        this.sendButton = document.getElementById('support-chat-send');
        this.closeButton = document.getElementById('support-chat-close');
    }

    bindEvents() {
        // فتح/إغلاق الشات
        this.chatFab.addEventListener('click', () => this.toggleChat());
        this.closeButton.addEventListener('click', () => this.closeChat());

        // إرسال الرسالة
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // إغلاق عند الضغط خارج النافذة
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.chatWindow.contains(e.target) && !this.chatFab.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.chatWindow.classList.add('open');
        this.chatFab.style.display = 'none';
        this.chatInput.focus();
    }

    closeChat() {
        this.isOpen = false;
        this.chatWindow.classList.remove('open');
        this.chatFab.style.display = 'flex';
    }

    addMessage(content, isUser = false) {
        const message = document.createElement('div');
        message.className = `support-message ${isUser ? 'user' : 'bot'}`;
        message.textContent = content;
        this.messagesContainer.appendChild(message);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        const messageData = { content, isUser, timestamp: new Date() };
        this.messages.push(messageData);
        this.userContext.conversationHistory.push(messageData);

        // تحديث وقت آخر تفاعل
        this.userContext.lastInteractionTime = new Date();

        // حفظ المحادثة محلياً للتعلم
        this.saveConversationData();
    }

    addWelcomeMessage() {
        setTimeout(() => {
            const timeBasedGreeting = this.getTimeBasedGreeting();
            const welcomeMessages = [
                `${timeBasedGreeting} أنا مساعد الذكاء الاصطناعي المطور لمتجر München Store! 🤖✨`,
                'يمكنني مساعدتك في: الأسعار 💰، طرق الدفع 💳، المنتجات 🛍️، والدعم الفني 🛠️',
                'تم تطويري بتقنيات ذكية متقدمة لأقدم لك أفضل تجربة دعم ممكنة! 🚀'
            ];

            welcomeMessages.forEach((msg, index) => {
                setTimeout(() => this.addMessage(msg), index * 1500);
            });

            // جدولة رسائل المتابعة
            this.scheduleFollowUp();
        }, 1000);
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <i class="fas fa-robot" style="color: #00d4aa;"></i>
            <span>يكتب...</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // تحليل رضا المستخدم
        const satisfaction = this.analyzeSatisfaction(message);

        // إضافة رسالة المستخدم
        this.addMessage(message, true);
        this.chatInput.value = '';
        this.sendButton.disabled = true;

        // إظهار مؤشر الكتابة
        this.showTypingIndicator();

        // تحليل الرسالة وتوليد الرد
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateAIResponse(message);

            // التحقق من جودة الرد
            if (response.isHelpful === false) {
                this.failedAttempts++;
                if (this.failedAttempts >= this.maxFailedAttempts && !this.isTransferredToHuman) {
                    this.transferToHuman();
                    return;
                }
            } else {
                this.failedAttempts = Math.max(0, this.failedAttempts - 1);
            }

            this.addMessage(response.message || response);

            // إضافة اقتراحات ذكية إذا كانت متاحة
            const suggestions = this.getSmartSuggestions();
            if (suggestions.length > 0 && Math.random() > 0.7) { // 30% احتمال إظهار الاقتراحات
                setTimeout(() => {
                    const suggestionMessage = '💡 **اقتراحات قد تهمك:**\n\n' + suggestions.map(s => `• ${s}`).join('\n');
                    this.addMessage(suggestionMessage);
                }, 2000);
            }

            this.sendButton.disabled = false;
        }, 1500 + Math.random() * 1000);
    }

    transferToHuman() {
        this.isTransferredToHuman = true;
        this.addMessage('أعتذر، يبدو أنني لم أستطع مساعدتك بالشكل المطلوب. 😔');

        setTimeout(() => {
            this.addMessage('سأقوم بتحويلك إلى أحد أعضاء فريق الدعم البشري للحصول على مساعدة أفضل. 👨‍💻');
        }, 1000);

        setTimeout(() => {
            this.addMessage(`
                📞 يمكنك التواصل مباشرة مع فريق الدعم:

                📧 البريد الإلكتروني: aboodhammoud54@gmail.com
                💬 ديسكورد: https://discord.gg/HesawbYhqE

                ⏰ نرد خلال 24 ساعة كحد أقصى

                شكراً لصبرك! 🙏
            `);
        }, 2000);
    }

    analyzeUserIntent(message) {
        const intents = {
            pricing: ['سعر', 'كم', 'تكلفة', 'ثمن', 'price', 'cost'],
            payment: ['دفع', 'paypal', 'شراء', 'payment', 'buy'],
            products: ['بوت', 'ديسكورد', 'يوزر', 'موقع', 'برمجة', 'bot', 'discord'],
            support: ['دعم', 'مساعدة', 'مشكلة', 'help', 'support', 'problem'],
            greeting: ['مرحبا', 'السلام', 'أهلا', 'hello', 'hi'],
            thanks: ['شكر', 'ممتاز', 'رائع', 'thanks', 'thank you']
        };

        const lowerMessage = message.toLowerCase();
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return intent;
            }
        }
        return 'unknown';
    }

    generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();
        const intent = this.analyzeUserIntent(message);

        // تحديث سياق المستخدم
        if (!this.userContext.askedAbout.includes(intent)) {
            this.userContext.askedAbout.push(intent);
        }

        // تحليل المشاعر والسياق المتقدم
        const sentiment = this.analyzeSentiment(message);
        const complexity = this.analyzeComplexity(message);
        const urgency = this.analyzeUrgency(message);

        // ردود ذكية محسنة حسب السياق والنية
        switch(intent) {
            case 'pricing':
                const pricingResponses = this.getPricingResponses(sentiment, complexity);
                return { message: pricingResponses[Math.floor(Math.random() * pricingResponses.length)], isHelpful: true };

            case 'payment':
                const paymentResponse = this.getPaymentResponse(sentiment, urgency);
                return { message: paymentResponse, isHelpful: true };

            case 'products':
                return this.getProductResponse(message, sentiment, complexity);

            case 'support':
                return {
                    message: 'فريق الدعم الفني جاهز لمساعدتك! 🛠️\n\n📧 البريد: aboodhammoud54@gmail.com\n💬 ديسكورد: https://discord.gg/HesawbYhqE\n⏰ نرد خلال 24 ساعة\n\n🔧 نقدم دعم شامل لجميع منتجاتنا\n✅ حل المشاكل التقنية\n✅ التخصيص والتطوير\n✅ التدريب على الاستخدام',
                    isHelpful: true
                };

            case 'greeting':
                const greetings = [
                    'أهلاً وسهلاً بك في متجر München Store! 👋\n\nأنا هنا لمساعدتك في أي استفسار حول:\n🤖 بوتات ديسكورد\n👤 يوزرات حصرية\n🌐 مواقع شخصية\n💰 الأسعار والدفع',
                    'مرحباً بك! 😊\n\nكيف يمكنني مساعدتك اليوم؟ يمكنني الإجابة على جميع أسئلتك حول منتجاتنا وخدماتنا!'
                ];
                return { message: greetings[Math.floor(Math.random() * greetings.length)], isHelpful: true };

            case 'thanks':
                return {
                    message: 'العفو! سعيد جداً لمساعدتك! 😊\n\nإذا كان لديك أي استفسارات أخرى، أنا هنا دائماً. نحن نقدر ثقتك في متجر München Store! 🙏',
                    isHelpful: true
                };
        }
        
        // ردود افتراضية ذكية مع تتبع المحاولات الفاشلة
        const sessionTime = (new Date() - this.userContext.sessionStart) / 1000 / 60; // بالدقائق

        if (this.failedAttempts === 0) {
            return {
                message: 'أعتذر، لم أفهم سؤالك بوضوح. 🤔\n\nيمكنك سؤالي عن:\n💰 الأسعار والتكاليف\n💳 طرق الدفع\n🛍️ المنتجات المتاحة\n🛠️ الدعم الفني\n\nأو اكتب سؤالك بطريقة أخرى وسأحاول مساعدتك!',
                isHelpful: false
            };
        } else if (this.failedAttempts === 1) {
            return {
                message: 'دعني أحاول مساعدتك بطريقة أخرى! 💡\n\nهل تريد:\n🔹 معرفة أسعار منتج معين؟\n🔹 طريقة الشراء والدفع؟\n🔹 تفاصيل عن خدماتنا؟\n🔹 التواصل مع الدعم الفني؟\n\nاختر ما يناسبك أو اكتب سؤالك بكلمات أبسط.',
                isHelpful: false
            };
        } else {
            return {
                message: 'أعتذر بشدة، يبدو أنني لا أستطيع فهم احتياجك بالشكل الصحيح. 😔\n\nسأقوم بتحويلك لأحد أعضاء فريق الدعم البشري للحصول على مساعدة أفضل.\n\nهل توافق على ذلك؟',
                isHelpful: false
            };
        }
    }

    // وظائف إضافية للذكاء الاصطناعي المحسن
    detectLanguage(message) {
        const arabicPattern = /[\u0600-\u06FF]/;
        return arabicPattern.test(message) ? 'ar' : 'en';
    }

    // تحليل المشاعر المتقدم
    analyzeSentiment(message) {
        const positiveWords = ['ممتاز', 'رائع', 'جيد', 'أحب', 'مفيد', 'شكر', 'thanks', 'good', 'great', 'excellent', 'love'];
        const negativeWords = ['سيء', 'مشكلة', 'خطأ', 'لا يعمل', 'معطل', 'bad', 'problem', 'error', 'broken', 'issue'];
        const neutralWords = ['كيف', 'ماذا', 'متى', 'أين', 'how', 'what', 'when', 'where'];

        const lowerMessage = message.toLowerCase();

        let positiveScore = positiveWords.filter(word => lowerMessage.includes(word)).length;
        let negativeScore = negativeWords.filter(word => lowerMessage.includes(word)).length;
        let neutralScore = neutralWords.filter(word => lowerMessage.includes(word)).length;

        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        if (neutralScore > 0) return 'neutral';
        return 'neutral';
    }

    // تحليل تعقيد السؤال
    analyzeComplexity(message) {
        const complexWords = ['كيفية', 'طريقة', 'خطوات', 'تفصيل', 'شرح', 'how to', 'explain', 'detail', 'step'];
        const simpleWords = ['سعر', 'كم', 'نعم', 'لا', 'price', 'yes', 'no'];

        const lowerMessage = message.toLowerCase();
        const hasComplexWords = complexWords.some(word => lowerMessage.includes(word));
        const hasSimpleWords = simpleWords.some(word => lowerMessage.includes(word));

        if (hasComplexWords) return 'complex';
        if (hasSimpleWords) return 'simple';
        return 'medium';
    }

    // تحليل الإلحاح
    analyzeUrgency(message) {
        const urgentWords = ['عاجل', 'سريع', 'فوري', 'الآن', 'urgent', 'quick', 'fast', 'now', 'asap'];
        const lowerMessage = message.toLowerCase();

        return urgentWords.some(word => lowerMessage.includes(word)) ? 'high' : 'normal';
    }

    // ردود الأسعار المحسنة حسب السياق
    getPricingResponses(sentiment, complexity) {
        const baseResponses = [
            'أسعارنا تنافسية جداً! 💰\n\n🤖 بوتات ديسكورد: تبدأ من $4.99\n👤 يوزرات ديسكورد: تبدأ من $25\n🌐 مواقع شخصية: تبدأ من $399\n\nجميع الأسعار شاملة الدعم الفني!',
            'هل تريد معرفة سعر منتج معين؟ يمكنني مساعدتك:\n\n• بوت إدارة سيرفر: $9.99\n• بوت ترحيب وتفاعل: $4.99\n• يوزرات حصرية: $25-$50\n• موقع شخصي احترافي: $399+'
        ];

        if (complexity === 'complex') {
            return [
                'دعني أشرح لك تفاصيل الأسعار بالكامل! 📊\n\n🤖 **بوتات ديسكورد:**\n• بوت إدارة شامل: $9.99 (يشمل جميع الميزات)\n• بوت ترحيب وتفاعل: $4.99 (مثالي للمبتدئين)\n\n👤 **يوزرات ديسكورد:**\n• يوزرات عادية: $25-$35\n• يوزرات مميزة: $40-$50\n\n🌐 **مواقع شخصية:**\n• موقع بسيط: $399\n• موقع متقدم: $599+\n\n✅ جميع الأسعار تشمل:\n- الكود المصدري\n- دعم فني لمدة 6 أشهر\n- تحديثات مجانية\n- شرح طريقة الاستخدام'
            ];
        }

        if (sentiment === 'positive') {
            return [
                'سعيد لاهتمامك! 😊 أسعارنا مدروسة بعناية لتناسب الجميع:\n\n💎 **عروض خاصة:**\n🤖 بوتات ديسكورد: من $4.99\n👤 يوزرات حصرية: من $25\n🌐 مواقع احترافية: من $399\n\n🎁 **مكافأة:** خصم 10% عند شراء أكثر من منتج!'
            ];
        }

        return baseResponses;
    }

    suggestProducts(userMessage) {
        const message = userMessage.toLowerCase();
        const suggestions = [];

        if (message.includes('رخيص') || message.includes('اقتصادي') || message.includes('budget')) {
            suggestions.push('🎯 **الخيار الاقتصادي:** بوت الترحيب والتفاعل ($4.99) - أفضل قيمة مقابل السعر!');
            suggestions.push('💡 **بديل ممتاز:** يوزرات ديسكورد ($25-$35) - حل سريع وفعال!');
        }

        if (message.includes('احترافي') || message.includes('متقدم') || message.includes('professional')) {
            suggestions.push('⭐ **الخيار الاحترافي:** بوت إدارة السيرفر ($9.99) - مميزات متقدمة شاملة!');
            suggestions.push('🌟 **للمشاريع الكبيرة:** موقع شخصي متقدم ($599+) - تصميم احترافي كامل!');
        }

        if (message.includes('سريع') || message.includes('بسيط') || message.includes('quick')) {
            suggestions.push('⚡ **حل سريع:** يوزرات ديسكورد ($25-$50) - جاهز للاستخدام فوراً!');
            suggestions.push('🚀 **تسليم سريع:** بوت ترحيب ($4.99) - يتم تسليمه خلال 24 ساعة!');
        }

        return suggestions;
    }

    // ردود الدفع المحسنة
    getPaymentResponse(sentiment, urgency) {
        const baseResponse = 'نحن نقبل الدفع عبر PayPal فقط لضمان الأمان الكامل! 💳\n\n✅ دفع آمن ومضمون\n✅ حماية المشتري\n✅ إمكانية الاسترداد\n\nيمكنك:\n• إضافة المنتجات للسلة والدفع مرة واحدة\n• الشراء المباشر من صفحة المنتج';

        if (urgency === 'high') {
            return '⚡ **دفع سريع وآمن عبر PayPal!** 💳\n\n🚀 **خطوات الدفع السريع:**\n1️⃣ اضغط على "شراء مباشر" أو أضف للسلة\n2️⃣ ستنتقل لـ PayPal تلقائياً\n3️⃣ ادفع بأمان خلال دقائق\n4️⃣ احصل على منتجك فوراً!\n\n✅ **مميزات PayPal:**\n• حماية كاملة للمشتري\n• دفع بالبطاقة أو الرصيد\n• إمكانية الاسترداد\n• تشفير عالي الأمان\n\n💡 **نصيحة:** استخدم "الشراء المباشر" للحصول على منتجك بأسرع وقت!';
        }

        if (sentiment === 'negative') {
            return '😊 أتفهم قلقك بشأن الدفع، دعني أطمئنك!\n\n🛡️ **لماذا PayPal آمن 100%:**\n• شركة عالمية موثوقة منذ 1998\n• حماية كاملة للمشتري\n• لا نحصل على بيانات بطاقتك\n• يمكنك استرداد أموالك بسهولة\n• تشفير عسكري للبيانات\n\n💳 **طرق الدفع المتاحة:**\n• بطاقة ائتمان/خصم\n• رصيد PayPal\n• تحويل بنكي\n• محافظ رقمية\n\n📞 **دعم فوري:** إذا واجهت أي مشكلة، نحن هنا لمساعدتك 24/7!';
        }

        return baseResponse;
    }

    // ردود المنتجات المحسنة
    getProductResponse(message, sentiment, complexity) {
        if (message.includes('بوت') || message.includes('bot')) {
            if (complexity === 'complex') {
                return {
                    message: '🤖 **دليل شامل لبوتات ديسكورد الاحترافية:**\n\n🏆 **بوت إدارة السيرفر الشامل ($9.99):**\n• 🛡️ نظام حماية متقدم ضد السبام والمتطفلين\n• ⚙️ أوامر إدارية شاملة (كتم، طرد، حظر)\n• 📊 إحصائيات مفصلة للسيرفر\n• 🎵 مشغل موسيقى عالي الجودة\n• 📝 نظام تذاكر الدعم الفني\n• 🎮 ألعاب تفاعلية متنوعة\n• 📋 نظام لوحة التحكم الويب\n\n⭐ **بوت الترحيب والتفاعل ($4.99):**\n• 👋 رسائل ترحيب مخصصة وجذابة\n• 🏅 نظام نقاط ومستويات تفاعلي\n• 🎁 مكافآت تلقائية للأعضاء النشطين\n• 📢 إعلانات تلقائية مجدولة\n• 🔔 تنبيهات الأحداث المهمة\n\n✅ **ما تحصل عليه:**\n• كود المصدر كاملاً\n• شرح مفصل للتثبيت\n• دعم فني لمدة 6 أشهر\n• تحديثات مجانية\n• تخصيص حسب احتياجاتك',
                    isHelpful: true
                };
            } else {
                return {
                    message: 'بوتات ديسكورد الاحترافية! 🤖\n\n🔹 **بوت إدارة سيرفر شامل ($9.99)**\n• أوامر إدارية متقدمة\n• نظام حماية قوي\n• لوحة تحكم سهلة\n\n🔹 **بوت ترحيب وتفاعل ($4.99)**\n• رسائل ترحيب مخصصة\n• نظام نقاط تفاعلي\n• إعداد سهل وسريع\n\n✨ جميع البوتات تأتي مع كود المصدر والدعم الفني!',
                    isHelpful: true
                };
            }
        } else if (message.includes('يوزر') || message.includes('user')) {
            if (sentiment === 'positive') {
                return {
                    message: '👤 **يوزرات ديسكورد الحصرية - مجموعة مميزة!** ✨\n\n🎯 **المتاح حالياً:**\n• 6 يوزرات حصرية جاهزة\n• أسماء فريدة وجذابة\n• ضمان عدم الاستخدام المسبق\n\n🔜 **قريباً:**\n• 14 يوزر إضافي مميز\n• تشكيلة متنوعة من الأسماء\n• خيارات أكثر للاختيار\n\n💎 **مستويات الأسعار:**\n• يوزرات عادية: $25-$35\n• يوزرات مميزة: $40-$50\n• يوزرات حصرية: $50+\n\n🎁 **عرض خاص:** اشتر يوزرين واحصل على خصم 15%!',
                    isHelpful: true
                };
            } else {
                return {
                    message: 'يوزرات ديسكورد حصرية ومميزة! 👤\n\n✨ متاح حالياً: 6 يوزرات\n🔜 قريباً: 14 يوزر إضافي\n💎 أسماء فريدة وجذابة\n🛡️ ضمان عدم الاستخدام المسبق\n\nالأسعار تتراوح من $25 إلى $50 حسب التميز!',
                    isHelpful: true
                };
            }
        } else {
            if (complexity === 'complex') {
                return {
                    message: '🌐 **دليل شامل لخدمات برمجة المواقع الشخصية:**\n\n🏗️ **ما نقدمه:**\n• 🎨 تصميم عصري ومتجاوب 100%\n• ⚡ سرعة تحميل فائقة (أقل من 3 ثوان)\n• 📱 متوافق مع جميع الأجهزة والمتصفحات\n• 🔍 SEO محسن لمحركات البحث\n• 🛡️ حماية عالية ضد الهجمات\n• 🌍 استضافة ودومين مجاني لسنة كاملة\n• 📧 بريد إلكتروني احترافي\n• 📊 تحليلات مفصلة للزوار\n\n💼 **أنواع المواقع:**\n• مواقع شخصية وسير ذاتية\n• مواقع الأعمال والشركات\n• متاجر إلكترونية بسيطة\n• مدونات ومواقع المحتوى\n• مواقع العروض والخدمات\n\n🎯 **الأسعار:**\n• موقع بسيط: $399\n• موقع متوسط: $599\n• موقع متقدم: $899+\n\n✅ **الضمانات:**\n• دعم فني مستمر لمدة سنة\n• تحديثات أمنية مجانية\n• تدريب على إدارة الموقع\n• نسخ احتياطية يومية',
                    isHelpful: true
                };
            } else {
                return {
                    message: 'نقدم خدمات برمجة المواقع الشخصية الاحترافية! 🌐\n\n✅ تصميم عصري ومتجاوب\n✅ سرعة تحميل عالية\n✅ متوافق مع جميع الأجهزة\n✅ SEO محسن\n✅ استضافة ودومين مجاني لسنة\n✅ دعم فني مستمر\n\nمثالي للأعمال والمشاريع الشخصية!',
                    isHelpful: true
                };
            }
        }
    }

    getContextualHelp() {
        const currentPage = window.location.pathname;

        if (currentPage.includes('bots.html')) {
            return 'أراك في صفحة بوتات ديسكورد! هل تحتاج مساعدة في اختيار البوت المناسب؟ 🤖';
        } else if (currentPage.includes('users.html')) {
            return 'أراك في صفحة اليوزرات! هل تريد معرفة المزيد عن اليوزرات المتاحة؟ 👤';
        } else if (currentPage.includes('websites.html')) {
            return 'أراك في صفحة المواقع الشخصية! هل تحتاج موقع لمشروعك؟ 🌐';
        } else {
            return 'مرحباً بك في متجر München Store! كيف يمكنني مساعدتك؟ 🏪';
        }
    }

    // حفظ بيانات المحادثة للتعلم
    saveConversationData() {
        try {
            const conversationData = {
                userContext: this.userContext,
                sessionId: this.generateSessionId(),
                timestamp: new Date().toISOString()
            };

            localStorage.setItem('munchen_ai_conversation', JSON.stringify(conversationData));
        } catch (error) {
            console.log('خطأ في حفظ بيانات المحادثة:', error);
        }
    }

    // تحميل بيانات المحادثة السابقة
    loadConversationData() {
        try {
            const savedData = localStorage.getItem('munchen_ai_conversation');
            if (savedData) {
                const data = JSON.parse(savedData);
                // دمج البيانات المحفوظة مع السياق الحالي
                if (data.userContext) {
                    this.userContext.userPreferences = data.userContext.userPreferences || {};
                    this.userContext.satisfactionScore = data.userContext.satisfactionScore || 0;
                }
            }
        } catch (error) {
            console.log('خطأ في تحميل بيانات المحادثة:', error);
        }
    }

    // توليد معرف جلسة فريد
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // تحليل رضا المستخدم من الردود
    analyzeSatisfaction(userMessage) {
        const satisfactionWords = {
            positive: ['شكر', 'ممتاز', 'رائع', 'مفيد', 'جيد', 'thanks', 'great', 'excellent', 'helpful'],
            negative: ['سيء', 'غير مفيد', 'لا أفهم', 'مشكلة', 'bad', 'unhelpful', 'confusing', 'problem']
        };

        const lowerMessage = userMessage.toLowerCase();

        let positiveScore = satisfactionWords.positive.filter(word => lowerMessage.includes(word)).length;
        let negativeScore = satisfactionWords.negative.filter(word => lowerMessage.includes(word)).length;

        if (positiveScore > 0) {
            this.userContext.satisfactionScore += positiveScore;
            return 'positive';
        } else if (negativeScore > 0) {
            this.userContext.satisfactionScore -= negativeScore;
            return 'negative';
        }

        return 'neutral';
    }

    // اقتراح ردود ذكية بناءً على التاريخ
    getSmartSuggestions() {
        const recentTopics = this.userContext.askedAbout.slice(-3);
        const suggestions = [];

        if (recentTopics.includes('pricing') && !recentTopics.includes('payment')) {
            suggestions.push('هل تريد معرفة طرق الدفع المتاحة؟');
        }

        if (recentTopics.includes('products') && !recentTopics.includes('support')) {
            suggestions.push('هل تحتاج مساعدة في اختيار المنتج المناسب؟');
        }

        return suggestions;
    }

    // رسائل المتابعة الذكية
    scheduleFollowUp() {
        const timeSinceLastInteraction = new Date() - this.userContext.lastInteractionTime;
        const fiveMinutes = 5 * 60 * 1000;

        if (timeSinceLastInteraction > fiveMinutes && this.userContext.conversationHistory.length > 2) {
            setTimeout(() => {
                if (!this.isOpen) return; // لا ترسل إذا كان الشات مغلق

                const followUpMessages = [
                    'هل تحتاج مساعدة إضافية؟ أنا هنا إذا كان لديك أي استفسارات أخرى! 😊',
                    'إذا كان لديك أي أسئلة أخرى، لا تتردد في سؤالي! 🤝',
                    'هل كانت المعلومات مفيدة؟ يمكنني مساعدتك في أي شيء آخر! 💡'
                ];

                const randomMessage = followUpMessages[Math.floor(Math.random() * followUpMessages.length)];
                this.addMessage(randomMessage);
            }, fiveMinutes);
        }
    }

    // تحسين الردود بناءً على الوقت
    getTimeBasedGreeting() {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return 'صباح الخير! ☀️ كيف يمكنني مساعدتك اليوم؟';
        } else if (hour >= 12 && hour < 17) {
            return 'مساء الخير! 🌤️ أهلاً بك في متجر München Store!';
        } else if (hour >= 17 && hour < 21) {
            return 'مساء الخير! 🌅 سعيد بزيارتك لمتجرنا!';
        } else {
            return 'أهلاً بك! 🌙 نحن متاحون على مدار الساعة لمساعدتك!';
        }
    }
}

// تشغيل الشات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.supportChat = new SupportChat();

    // إضافة اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        // Ctrl + H لفتح الشات
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            if (window.supportChat) {
                window.supportChat.toggleChat();
            }
        }
    });
});
