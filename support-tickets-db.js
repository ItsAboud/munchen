// نظام قاعدة بيانات تذاكر الدعم الفني المشتركة
class SupportTicketsDB {
    constructor() {
        this.storageKey = 'support_tickets';
        this.notificationsKey = 'support_notifications';
        this.syncUrl = 'tickets-data.json'; // ملف JSON للمزامنة
        this.lastSyncTime = 0;
        this.init();
    }

    async init() {
        // محاولة تحميل البيانات من الخادم أولاً
        await this.syncFromServer();

        // بدء المزامنة التلقائية كل 10 ثوان
        setInterval(() => {
            this.syncFromServer();
        }, 10000);

        // مزامنة عند إغلاق/تحديث الصفحة
        window.addEventListener('beforeunload', () => {
            this.syncToServer();
        });

        // مزامنة عند العودة للصفحة (focus)
        window.addEventListener('focus', () => {
            this.syncFromServer();
        });
    }

    // الحصول على جميع التذاكر
    getTickets() {
        try {
            const tickets = localStorage.getItem(this.storageKey);
            return tickets ? JSON.parse(tickets) : [];
        } catch (error) {
            console.error('خطأ في تحميل التذاكر:', error);
            return [];
        }
    }

    // حفظ التذاكر
    saveTickets(tickets) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(tickets));
            this.notifyAdmins();

            // مزامنة مع الخادم
            this.syncToServer();

            return true;
        } catch (error) {
            console.error('خطأ في حفظ التذاكر:', error);
            return false;
        }
    }

    // إضافة تذكرة جديدة
    addTicket(ticketData) {
        const tickets = this.getTickets();
        const newTicket = {
            id: this.generateTicketId(),
            customerName: ticketData.customerName,
            customerEmail: ticketData.customerEmail,
            subject: ticketData.subject,
            priority: ticketData.priority || 'medium',
            category: ticketData.category || 'technical',
            description: ticketData.description,
            attachments: ticketData.attachments || [],
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            responses: []
        };

        tickets.unshift(newTicket);
        this.saveTickets(tickets);
        
        // إرسال إشعار للإدارة
        this.addNotification({
            type: 'new_ticket',
            ticketId: newTicket.id,
            message: `تذكرة جديدة من ${newTicket.customerName}: ${newTicket.subject}`,
            timestamp: new Date().toISOString()
        });

        return newTicket;
    }

    // تحديث تذكرة
    updateTicket(ticketId, updates) {
        const tickets = this.getTickets();
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        
        if (ticketIndex === -1) return false;

        tickets[ticketIndex] = {
            ...tickets[ticketIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveTickets(tickets);
        return tickets[ticketIndex];
    }

    // إضافة رد على تذكرة
    addResponse(ticketId, response) {
        const tickets = this.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (!ticket) return false;

        if (!ticket.responses) {
            ticket.responses = [];
        }

        const newResponse = {
            id: this.generateResponseId(),
            author: response.author,
            message: response.message,
            createdAt: new Date().toISOString(),
            isAdmin: response.isAdmin || false
        };

        ticket.responses.push(newResponse);
        ticket.updatedAt = new Date().toISOString();
        
        // تغيير حالة التذكرة حسب من يرد
        if (response.isAdmin) {
            ticket.status = 'pending';
        } else {
            ticket.status = 'open';
        }

        this.saveTickets(tickets);

        // إرسال إشعار
        if (response.isAdmin) {
            this.addNotification({
                type: 'admin_reply',
                ticketId: ticketId,
                message: `رد جديد من الإدارة على التذكرة #${ticketId}`,
                timestamp: new Date().toISOString()
            });
        } else {
            this.addNotification({
                type: 'customer_reply',
                ticketId: ticketId,
                message: `رد جديد من العميل على التذكرة #${ticketId}`,
                timestamp: new Date().toISOString()
            });
        }

        return newResponse;
    }

    // تغيير حالة التذكرة
    updateTicketStatus(ticketId, newStatus) {
        return this.updateTicket(ticketId, { status: newStatus });
    }

    // حذف تذكرة
    deleteTicket(ticketId) {
        const tickets = this.getTickets();
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);

        if (ticketIndex === -1) return false;

        // حذف التذكرة من المصفوفة
        tickets.splice(ticketIndex, 1);

        // حفظ التذاكر المحدثة
        this.saveTickets(tickets);

        // إضافة إشعار بالحذف
        this.addNotification({
            type: 'ticket_deleted',
            ticketId: ticketId,
            message: `تم حذف التذكرة #${ticketId}`,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    // البحث في التذاكر
    searchTickets(query, filters = {}) {
        const tickets = this.getTickets();
        const lowerQuery = query.toLowerCase();

        return tickets.filter(ticket => {
            // البحث النصي
            const matchesQuery = !query || 
                ticket.subject.toLowerCase().includes(lowerQuery) ||
                ticket.customerName.toLowerCase().includes(lowerQuery) ||
                ticket.customerEmail.toLowerCase().includes(lowerQuery) ||
                ticket.description.toLowerCase().includes(lowerQuery);

            // فلترة الحالة
            const matchesStatus = !filters.status || ticket.status === filters.status;
            
            // فلترة الأولوية
            const matchesPriority = !filters.priority || ticket.priority === filters.priority;
            
            // فلترة التصنيف
            const matchesCategory = !filters.category || ticket.category === filters.category;

            return matchesQuery && matchesStatus && matchesPriority && matchesCategory;
        });
    }

    // الحصول على إحصائيات التذاكر
    getStats() {
        const tickets = this.getTickets();
        
        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            pending: tickets.filter(t => t.status === 'pending').length,
            closed: tickets.filter(t => t.status === 'closed').length,
            high: tickets.filter(t => t.priority === 'high').length,
            medium: tickets.filter(t => t.priority === 'medium').length,
            low: tickets.filter(t => t.priority === 'low').length,
            today: tickets.filter(t => {
                const today = new Date().toDateString();
                const ticketDate = new Date(t.createdAt).toDateString();
                return today === ticketDate;
            }).length
        };
    }

    // توليد معرف تذكرة فريد
    generateTicketId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `TK${timestamp}${random}`.slice(-10);
    }

    // توليد معرف رد فريد
    generateResponseId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 100);
        return `RP${timestamp}${random}`.slice(-8);
    }

    // إدارة الإشعارات
    addNotification(notification) {
        try {
            const notifications = this.getNotifications();
            notifications.unshift({
                id: Date.now(),
                ...notification,
                read: false
            });
            
            // الاحتفاظ بآخر 50 إشعار فقط
            if (notifications.length > 50) {
                notifications.splice(50);
            }
            
            localStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
        } catch (error) {
            console.error('خطأ في إضافة الإشعار:', error);
        }
    }

    getNotifications() {
        try {
            const notifications = localStorage.getItem(this.notificationsKey);
            return notifications ? JSON.parse(notifications) : [];
        } catch (error) {
            console.error('خطأ في تحميل الإشعارات:', error);
            return [];
        }
    }

    markNotificationAsRead(notificationId) {
        const notifications = this.getNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
        }
    }

    // إشعار المشرفين بالتذاكر الجديدة
    notifyAdmins() {
        // يمكن إضافة منطق إرسال إشعارات فورية هنا
        // مثل Web Push Notifications أو WebSocket
        console.log('تم إشعار المشرفين بالتحديث');
    }

    // مسح جميع التذاكر والبدء من جديد
    resetAllTickets() {
        this.clearAllData();
        console.log('تم مسح جميع التذاكر والبدء بقاعدة بيانات فارغة');
    }

    // تصدير البيانات
    exportTickets() {
        const tickets = this.getTickets();
        const dataStr = JSON.stringify(tickets, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `support-tickets-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // مسح جميع البيانات
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.notificationsKey);
        this.syncToServer(); // مزامنة الحذف مع الخادم
    }

    // مزامنة البيانات من الخادم
    async syncFromServer() {
        this.updateSyncStatus('syncing');

        try {
            const response = await fetch(this.syncUrl + '?t=' + Date.now());
            if (response.ok) {
                const serverData = await response.json();
                if (serverData && serverData.tickets) {
                    // دمج البيانات المحلية مع بيانات الخادم
                    const localTickets = this.getTickets();
                    const mergedTickets = this.mergeTickets(localTickets, serverData.tickets);

                    // حفظ البيانات المدموجة محلياً
                    localStorage.setItem(this.storageKey, JSON.stringify(mergedTickets));

                    this.updateSyncStatus('success');
                    console.log('تم تحديث البيانات من الخادم');
                } else {
                    this.updateSyncStatus('idle');
                }
            } else {
                this.updateSyncStatus('error');
            }
        } catch (error) {
            this.updateSyncStatus('error');
            console.log('تعذر الاتصال بالخادم، استخدام البيانات المحلية');
        }
    }

    // مزامنة البيانات إلى الخادم
    async syncToServer() {
        try {
            const tickets = this.getTickets();
            const dataToSync = {
                tickets: tickets,
                lastUpdate: new Date().toISOString()
            };

            // في بيئة الإنتاج، يجب إرسال البيانات إلى API
            // هنا سنحفظ في ملف JSON محلي للتطوير
            console.log('مزامنة البيانات:', dataToSync);

            // محاكاة إرسال البيانات للخادم
            // في الواقع، ستحتاج لـ API endpoint
            /*
            await fetch('/api/sync-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSync)
            });
            */

        } catch (error) {
            console.error('خطأ في مزامنة البيانات:', error);
        }
    }

    // دمج التذاكر المحلية مع تذاكر الخادم
    mergeTickets(localTickets, serverTickets) {
        const merged = [...serverTickets];

        // إضافة التذاكر المحلية التي لا توجد في الخادم
        localTickets.forEach(localTicket => {
            const existsInServer = serverTickets.find(serverTicket =>
                serverTicket.id === localTicket.id
            );

            if (!existsInServer) {
                merged.push(localTicket);
            }
        });

        // ترتيب حسب تاريخ الإنشاء
        return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // تحديث مؤشر حالة المزامنة
    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('sync-status');
        if (!syncStatusElement) return;

        switch (status) {
            case 'syncing':
                syncStatusElement.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> جاري المزامنة...';
                syncStatusElement.style.background = 'rgba(255, 193, 7, 0.2)';
                syncStatusElement.style.color = '#ffc107';
                syncStatusElement.style.borderColor = '#ffc107';
                break;

            case 'success':
                syncStatusElement.innerHTML = '<i class="fas fa-check-circle"></i> تم التحديث';
                syncStatusElement.style.background = 'rgba(87, 242, 135, 0.2)';
                syncStatusElement.style.color = '#57f287';
                syncStatusElement.style.borderColor = '#57f287';

                // العودة للحالة العادية بعد 3 ثوان
                setTimeout(() => {
                    this.updateSyncStatus('idle');
                }, 3000);
                break;

            case 'error':
                syncStatusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> خطأ في المزامنة';
                syncStatusElement.style.background = 'rgba(255, 85, 85, 0.2)';
                syncStatusElement.style.color = '#ff5555';
                syncStatusElement.style.borderColor = '#ff5555';

                // العودة للحالة العادية بعد 5 ثوان
                setTimeout(() => {
                    this.updateSyncStatus('idle');
                }, 5000);
                break;

            case 'idle':
            default:
                syncStatusElement.innerHTML = '<i class="fas fa-sync-alt"></i> مزامنة تلقائية';
                syncStatusElement.style.background = 'rgba(87, 242, 135, 0.2)';
                syncStatusElement.style.color = '#57f287';
                syncStatusElement.style.borderColor = '#57f287';
                break;
        }
    }
}

// إنشاء مثيل عام للاستخدام
window.supportTicketsDB = new SupportTicketsDB();

// مسح جميع التذاكر السابقة عند تحميل الصفحة
window.supportTicketsDB.clearAllData();
