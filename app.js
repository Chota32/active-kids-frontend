const { createApp } = Vue;

createApp({
  data() {
    return {
      siteName: 'Active Kids',
      apiUrl: 'https://m01034342-active-kids.onrender.com',
      lessons: [],
      sortBy: 'topic',
      sortOrder: 'asc',
      cart: [],
      showCart: false,
      name: '',
      phone: '',
      orderMessage: ''
    };
  },
  computed: {
    sortedLessons() {
      const key = this.sortBy;
      const direction = this.sortOrder === 'asc' ? 1 : -1;

      return [...this.lessons].sort((a, b) => {
        if (a[key] > b[key]) return direction;
        if (a[key] < b[key]) return -direction;
        return 0;
      });
    },
    cartItems() {
      return this.cart.map(id => this.lessons.find(lesson => lesson._id === id));
    },
    nameValid() {
      return /^[A-Za-z ]+$/.test(this.name);
    },
    phoneValid() {
      return /^[0-9]+$/.test(this.phone);
    },
    canCheckout() {
      return this.nameValid && this.phoneValid && this.cart.length > 0;
    }
  },
  methods: {
    addToCart(lesson) {
      if (lesson.space > 0) {
        this.cart.push(lesson._id);
        lesson.space--;
      }
    },
    toggleCart() {
      this.showCart = !this.showCart;
      this.orderMessage = '';
    },
    removeFromCart(index) {
      const id = this.cart[index];
      const lesson = this.lessons.find(lesson => lesson._id === id);
      lesson.space++;
      this.cart.splice(index, 1);

      if (this.cart.length === 0) {
        this.showCart = false;
      }
    },
    checkout() {
      const lessonIDs = [...new Set(this.cart)];

      const order = {
        name: this.name,
        phone: this.phone,
        lessonIDs: lessonIDs,
        spaces: this.cart.length
      };

      // 1) POST: save the order
      fetch(this.apiUrl + '/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      })
        .then(response => response.json())
        .then(() => {
          // 2) PUT: set each lesson's space to its new remaining number
          const updates = lessonIDs.map(id => {
            const lesson = this.lessons.find(lesson => lesson._id === id);
            return fetch(this.apiUrl + '/lessons/' + id, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ space: lesson.space })
            });
          });
          return Promise.all(updates);
        })
        .then(() => {
          // 3) Confirm and reset
          this.orderMessage = 'Thank you ' + this.name + ', your order has been submitted!';
          this.cart = [];
          this.name = '';
          this.phone = '';
        })
        .catch(error => {
          console.error('Checkout failed:', error);
          this.orderMessage = 'Sorry, something went wrong. Please try again.';
        });
    }
  },
  mounted() {
    fetch(this.apiUrl + '/lessons')
      .then(response => response.json())
      .then(data => {
        this.lessons = data;
      })
      .catch(error => console.error('Could not load lessons:', error));
  }
}).mount('#app');
