// نظام قاعدة البيانات المحلية للطلبات
class OrdersDatabase {
    constructor() {
        this.storageKey = 'munchen-orders-db';
        this.lastSyncTime = 0;
        this.init();
    }

    async init() {
        // إنشاء قاعدة البيانات إذا لم تكن موجودة
        if (!localStorage.getItem(this.storageKey)) {
            const initialDB = {
                orders: [],
                customers: [],
                stats: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    lastOrderId: 0
                },
                settings: {
                    currency: 'USD',
                    taxRate: 0,
                    createdAt: new Date().toISOString()
                }
            };
            this.saveDatabase(initialDB);
        }

        // بدء المزامنة التلقائية كل 5 ثوان
        setInterval(() => {
            this.syncData();
        }, 5000);

        // مزامنة عند العودة للصفحة (focus)
        window.addEventListener('focus', () => {
            this.syncData();
        });

        // مزامنة عند تغيير localStorage في تبويب آخر
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey + '_shared') {
                this.loadSharedData();
            }
        });
    }

    // حفظ قاعدة البيانات
    saveDatabase(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));

        // حفظ في التخزين المشترك للمزامنة
        this.saveSharedData(data);
    }

    // تحميل قاعدة البيانات
    loadDatabase() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    // إنشاء طلب جديد
    createOrder(orderData) {
        const db = this.loadDatabase();
        const orderId = db.stats.lastOrderId + 1;
        
        const newOrder = {
            id: orderId,
            customerId: this.getOrCreateCustomer(orderData.customerInfo),
            items: orderData.items,
            total: orderData.total,
            status: 'pending', // pending, processing, completed, cancelled
            paymentMethod: 'paypal',
            paymentStatus: 'pending', // pending, paid, failed, refunded
            orderDate: new Date().toISOString(),
            deliveryDate: null,
            notes: orderData.notes || '',
            customerInfo: orderData.customerInfo,
            metadata: {
                userAgent: navigator.userAgent,
                ip: 'local', // في بيئة حقيقية يمكن الحصول على IP
                source: window.location.pathname
            }
        };

        // إضافة الطلب
        db.orders.push(newOrder);
        
        // تحديث الإحصائيات
        db.stats.lastOrderId = orderId;
        db.stats.totalOrders += 1;
        db.stats.totalRevenue += parseFloat(orderData.total);

        this.saveDatabase(db);
        return newOrder;
    }

    // إنشاء أو الحصول على عميل
    getOrCreateCustomer(customerInfo) {
        const db = this.loadDatabase();
        
        // البحث عن عميل موجود
        let customer = db.customers.find(c =>
            c.email === customerInfo.email
        );

        if (!customer) {
            // إنشاء عميل جديد
            customer = {
                id: db.customers.length + 1,
                name: customerInfo.name,
                email: customerInfo.email,
                joinDate: new Date().toISOString(),
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: null
            };
            db.customers.push(customer);
        }

        // تحديث إحصائيات العميل
        customer.totalOrders += 1;
        customer.totalSpent += parseFloat(customerInfo.orderTotal || 0);
        customer.lastOrderDate = new Date().toISOString();

        this.saveDatabase(db);
        return customer.id;
    }

    // الحصول على جميع الطلبات
    getAllOrders() {
        const db = this.loadDatabase();
        return db.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    }

    // الحصول على طلب بالمعرف
    getOrderById(orderId) {
        const db = this.loadDatabase();
        return db.orders.find(order => order.id === orderId);
    }

    // تحديث حالة الطلب
    updateOrderStatus(orderId, status, paymentStatus = null) {
        const db = this.loadDatabase();
        const orderIndex = db.orders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            db.orders[orderIndex].status = status;
            if (paymentStatus) {
                db.orders[orderIndex].paymentStatus = paymentStatus;
            }
            if (status === 'completed') {
                db.orders[orderIndex].deliveryDate = new Date().toISOString();
            }
            this.saveDatabase(db);
            return true;
        }
        return false;
    }

    // الحصول على الإحصائيات
    getStats() {
        const db = this.loadDatabase();
        const orders = db.orders;
        
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        return {
            ...db.stats,
            todayOrders: orders.filter(o => new Date(o.orderDate).toDateString() === today).length,
            thisMonthOrders: orders.filter(o => new Date(o.orderDate).getMonth() === thisMonth).length,
            thisYearOrders: orders.filter(o => new Date(o.orderDate).getFullYear() === thisYear).length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            totalCustomers: db.customers.length,
            averageOrderValue: db.stats.totalOrders > 0 ? (db.stats.totalRevenue / db.stats.totalOrders).toFixed(2) : 0
        };
    }

    // البحث في الطلبات
    searchOrders(query) {
        const db = this.loadDatabase();
        const searchTerm = query.toLowerCase();
        
        return db.orders.filter(order => 
            order.id.toString().includes(searchTerm) ||
            order.customerInfo.name.toLowerCase().includes(searchTerm) ||
            order.customerInfo.email.toLowerCase().includes(searchTerm) ||
            order.items.some(item => item.title.toLowerCase().includes(searchTerm)) ||
            order.status.toLowerCase().includes(searchTerm)
        );
    }

    // تصدير البيانات
    exportData() {
        const db = this.loadDatabase();
        const exportData = {
            ...db,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `munchen-orders-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // استيراد البيانات
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.orders && data.customers && data.stats) {
                this.saveDatabase(data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            return false;
        }
    }

    // حذف جميع البيانات (إعادة تعيين)
    resetDatabase() {
        localStorage.removeItem(this.storageKey);
        this.init();
    }

    // الحصول على تقرير مفصل
    getDetailedReport() {
        const db = this.loadDatabase();
        const orders = db.orders;
        
        // تجميع البيانات حسب المنتج
        const productStats = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productStats[item.title]) {
                    productStats[item.title] = {
                        name: item.title,
                        totalSold: 0,
                        totalRevenue: 0,
                        price: item.price
                    };
                }
                productStats[item.title].totalSold += 1;
                productStats[item.title].totalRevenue += parseFloat(item.price);
            });
        });

        // تجميع البيانات حسب الشهر
        const monthlyStats = {};
        orders.forEach(order => {
            const month = new Date(order.orderDate).toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyStats[month]) {
                monthlyStats[month] = {
                    orders: 0,
                    revenue: 0
                };
            }
            monthlyStats[month].orders += 1;
            monthlyStats[month].revenue += parseFloat(order.total);
        });

        return {
            overview: this.getStats(),
            productStats: Object.values(productStats).sort((a, b) => b.totalRevenue - a.totalRevenue),
            monthlyStats: monthlyStats,
            recentOrders: orders.slice(0, 10),
            topCustomers: db.customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10)
        };
    }

    // مزامنة البيانات المحلية
    syncData() {
        this.updateSyncStatus('syncing');

        try {
            const sharedData = this.getSharedData();
            const localData = this.loadDatabase();

            if (sharedData && sharedData.orders) {
                const mergedData = this.mergeData(localData, sharedData);

                // تحديث البيانات المحلية إذا كان هناك تغيير
                if (JSON.stringify(mergedData) !== JSON.stringify(localData)) {
                    localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
                    this.updateSyncStatus('success');

                    // إشعار التطبيق بالتحديث
                    if (window.loadData) {
                        window.loadData();
                    }

                    console.log('تم تحديث الطلبات من جهاز آخر');
                } else {
                    this.updateSyncStatus('idle');
                }
            } else {
                this.updateSyncStatus('idle');
            }
        } catch (error) {
            this.updateSyncStatus('error');
            console.log('خطأ في مزامنة البيانات المحلية');
        }
    }

    // حفظ البيانات في التخزين المشترك
    saveSharedData(data) {
        try {
            const sharedData = {
                ...data,
                lastUpdate: new Date().toISOString(),
                deviceId: this.getDeviceId()
            };
            localStorage.setItem(this.storageKey + '_shared', JSON.stringify(sharedData));
        } catch (error) {
            console.error('خطأ في حفظ البيانات المشتركة:', error);
        }
    }

    // تحميل البيانات من التخزين المشترك
    getSharedData() {
        try {
            const data = localStorage.getItem(this.storageKey + '_shared');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('خطأ في تحميل البيانات المشتركة:', error);
            return null;
        }
    }

    // تحميل البيانات المشتركة عند تغييرها
    loadSharedData() {
        try {
            const sharedData = this.getSharedData();
            if (sharedData && sharedData.orders) {
                const localData = this.loadDatabase();
                const mergedData = this.mergeData(localData, sharedData);

                localStorage.setItem(this.storageKey, JSON.stringify(mergedData));

                // إشعار التطبيق بالتحديث
                if (window.loadData) {
                    window.loadData();
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات المشتركة:', error);
        }
    }

    // الحصول على معرف الجهاز
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    // دمج البيانات المحلية مع بيانات الخادم
    mergeData(localData, serverData) {
        const merged = { ...serverData };

        // دمج الطلبات
        const allOrders = [...serverData.orders];
        localData.orders.forEach(localOrder => {
            const existsInServer = serverData.orders.find(serverOrder =>
                serverOrder.id === localOrder.id
            );

            if (!existsInServer) {
                allOrders.push(localOrder);
            }
        });

        // دمج العملاء
        const allCustomers = [...serverData.customers];
        localData.customers.forEach(localCustomer => {
            const existsInServer = serverData.customers.find(serverCustomer =>
                serverCustomer.email === localCustomer.email
            );

            if (!existsInServer) {
                allCustomers.push(localCustomer);
            }
        });

        // تحديث الإحصائيات
        merged.orders = allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        merged.customers = allCustomers;
        merged.stats.totalOrders = allOrders.length;
        merged.stats.totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        merged.stats.lastOrderId = Math.max(...allOrders.map(o => o.id), 0);

        return merged;
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

// إنشاء مثيل عام من قاعدة البيانات
window.ordersDB = new OrdersDatabase();
