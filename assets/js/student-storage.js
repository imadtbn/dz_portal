// LocalStorage Wrapper for Favorites & Recent History
const StorageApp = {
    FAV_KEY: 'student_dz_favorites',
    RECENT_KEY: 'student_dz_recent',

    getFavorites: function() {
        try {
            return JSON.parse(localStorage.getItem(this.FAV_KEY) || '[]');
        } catch (error) {
            localStorage.removeItem(this.FAV_KEY);
            return [];
        }
    },

    addFavorite: function(item) {
        // item = { id, title, description, url, icon, type }
        if (!item || !item.id) return false;
        let favs = this.getFavorites();
        if (favs.find(f => f.id === item.id)) return false;
        favs.push({ ...item, addedAt: item.addedAt || Date.now() });
        localStorage.setItem(this.FAV_KEY, JSON.stringify(favs));
        return true;
    },

    removeFavorite: function(id) {
        const favs = this.getFavorites().filter(f => f.id !== id);
        localStorage.setItem(this.FAV_KEY, JSON.stringify(favs));
        return true;
    },

    isFavorite: function(id) {
        return this.getFavorites().some(f => f.id === id);
    },

    updateFavorite: function(id, updates) {
        let found = false;
        const favs = this.getFavorites().map(item => {
            if (item.id !== id) return item;
            found = true;
            return { ...item, ...updates, id: item.id };
        });
        if (found) localStorage.setItem(this.FAV_KEY, JSON.stringify(favs));
        return found;
    },

    clearFavorites: function() {
        localStorage.setItem(this.FAV_KEY, '[]');
    },

    getRecent: function() {
        try {
            return JSON.parse(localStorage.getItem(this.RECENT_KEY) || '[]');
        } catch (error) {
            localStorage.removeItem(this.RECENT_KEY);
            return [];
        }
    },

    addRecent: function(item) {
        let recent = this.getRecent();
        recent = recent.filter(r => r.id !== item.id);
        recent.unshift(item);
        if (recent.length > 10) recent.pop();
        localStorage.setItem(this.RECENT_KEY, JSON.stringify(recent));
    },

    clearRecent: function() {
        localStorage.setItem(this.RECENT_KEY, '[]');
    }
};

// Public helper used by cards across Student DZ.
window.StudentFavorites = {
    toggle: function(item) {
        if (!item || !item.id) return false;
        if (StorageApp.isFavorite(item.id)) {
            StorageApp.removeFavorite(item.id);
            return false;
        }
        StorageApp.addFavorite(item);
        return true;
    },
    add: function(item) {
        return StorageApp.addFavorite(item);
    },
    remove: function(id) {
        return StorageApp.removeFavorite(id);
    },
    has: function(id) {
        return StorageApp.isFavorite(id);
    }
};
