import { BOOKS } from './data/booksData.js';
import { STORE_LOCATIONS, TIME_SLOTS } from './data/storesData.js';

const { useState, useEffect, useRef } = React;

// Main Esther's Bookshop Application
function EstherBookshopApp() {
  // State
  const [books, setBooks] = useState(BOOKS);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Cart & Checkout
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null); // Detail modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Checkout Form State
  const [selectedStore, setSelectedStore] = useState(STORE_LOCATIONS[0].id);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, mobile, pickup
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '888'
  });
  
  // Order Confirmation State
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOrderReceiptOpen, setIsOrderReceiptOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  // QR Code Canvas Ref
  const qrRef = useRef(null);

  // Load Order History & Cart from LocalStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('esthers_orders');
    if (savedOrders) {
      try { setOrderHistory(JSON.parse(savedOrders)); } catch (e) {}
    }
    const savedCart = localStorage.getItem('esthers_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('esthers_cart', JSON.stringify(cart));
  }, [cart]);

  // Trigger Lucide Icons refresh whenever UI updates
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // Render QR Code when active order modal opens
  useEffect(() => {
    if (isOrderReceiptOpen && activeOrder && qrRef.current) {
      qrRef.current.innerHTML = '';
      if (window.QRCode) {
        new window.QRCode(qrRef.current, {
          text: `ESTHER_PICKUP_${activeOrder.orderId}_STORE_${activeOrder.storeId}`,
          width: 140,
          height: 140,
          colorDark: "#451a03",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H
        });
      }
    }
  }, [isOrderReceiptOpen, activeOrder]);

  // Toast Trigger Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cart Functions
  const addToCart = (book, format = book.format, e) => {
    if (e) e.stopPropagation();
    
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === book.id && item.format === format);
      if (existing) {
        return prevCart.map(item =>
          item.id === book.id && item.format === format
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...book, format, quantity: 1 }];
    });

    showToast(`Added "${book.title}" to your Pickup Cart!`);
  };

  const updateQuantity = (id, format, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id && item.format === format) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id, format) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === id && item.format === format)));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const estimatedTax = cartSubtotal * 0.0625; // Massachusetts sales tax
  const cartTotal = cartSubtotal + estimatedTax;

  // Filter & Sort Books
  const genres = ['All', 'Fiction', 'Sci-Fi', 'Mystery', 'Self-Help', 'Biography', "Children's"];

  const filteredBooks = books.filter(book => {
    const matchesGenre = selectedGenre === 'All' || book.genre === selectedGenre;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = !inStockOnly || book.stock > 0;
    return matchesGenre && matchesSearch && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // featured default
  });

  // Handle Checkout Order Submission
  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert("Please fill in your name, email, and phone number for pickup notifications.");
      return;
    }

    const storeObj = STORE_LOCATIONS.find(s => s.id === selectedStore);
    const newOrder = {
      orderId: 'EB-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toLocaleString(),
      items: [...cart],
      subtotal: cartSubtotal,
      tax: estimatedTax,
      total: cartTotal,
      store: storeObj,
      storeId: selectedStore,
      timeSlot: selectedTimeSlot,
      paymentMethod: paymentMethod === 'card' ? 'Credit Card (Paid Online)' : paymentMethod === 'mobile' ? 'Apple/Google Pay (Paid)' : 'Pay on Pickup (In Store)',
      customer: { ...customerInfo },
      status: 'Ready for Pickup'
    };

    // Save order
    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem('esthers_orders', JSON.stringify(updatedHistory));

    // Reset Cart & Open Confirmation
    setActiveOrder(newOrder);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setIsOrderReceiptOpen(true);
    showToast(`Order #${newOrder.orderId} placed! Your Digital QR Pass is ready.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]">

      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-amber-900 text-amber-100 text-xs py-2 px-4 text-center flex justify-center items-center gap-4 font-medium tracking-wide">
        <span className="flex items-center gap-1">
          <i data-lucide="store" className="w-3.5 h-3.5 text-amber-300"></i>
          Esther's Express Pickup: Orders ready in under 60 minutes!
        </span>
        <span className="hidden sm:inline text-amber-400">•</span>
        <span className="hidden sm:inline flex items-center gap-1">
          <i data-lucide="coffee" className="w-3.5 h-3.5 text-amber-300"></i>
          Free artisan espresso with every in-store pickup
        </span>
      </div>

      {/* MAIN NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedGenre('All'); setSearchQuery(''); }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 flex items-center justify-center shadow-md shadow-amber-900/20">
              <i data-lucide="book-open" className="w-6 h-6 text-amber-200"></i>
            </div>
            <div>
              <span className="font-serif text-2xl font-bold text-stone-900 tracking-tight block leading-none">Esther's</span>
              <span className="text-xs uppercase tracking-widest text-amber-800 font-semibold mt-0.5 block">Bookshop & Pickup Lounge</span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <i data-lucide="search" className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
            <input 
              type="text"
              placeholder="Search books, authors, or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-100/80 border border-stone-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <i data-lucide="x" className="w-4 h-4"></i>
              </button>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Pickup Store Selector Badge */}
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Pickup Store</div>
              <div className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                <i data-lucide="map-pin" className="w-3 h-3 text-amber-700"></i>
                Main St Flagship
              </div>
            </div>

            {/* Order History Button */}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition"
            >
              <i data-lucide="receipt" className="w-4 h-4 text-amber-800"></i>
              My Passes ({orderHistory.length})
            </button>

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-amber-900 text-amber-50 hover:bg-amber-950 shadow-md shadow-amber-900/20 transition font-medium text-sm"
            >
              <i data-lucide="shopping-bag" className="w-4 h-4 text-amber-300"></i>
              <span>Pickup Cart</span>
              {cart.length > 0 && (
                <span className="bg-amber-400 text-amber-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-1">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>

          </div>

          {/* Mobile Menu & Cart Icon */}
          <div className="flex lg:hidden items-center gap-3">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-lg bg-stone-100 text-stone-800"
            >
              <i data-lucide="shopping-bag" className="w-5 h-5"></i>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-stone-100 text-stone-800"
            >
              <i data-lucide={isMobileMenuOpen ? "x" : "menu"} className="w-6 h-6"></i>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 space-y-4">
            <div className="relative">
              <i data-lucide="search" className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input 
                type="text"
                placeholder="Search books, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100 border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-sm"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <button 
                onClick={() => { setIsHistoryOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-amber-900"
              >
                <i data-lucide="receipt" className="w-4 h-4"></i>
                View My Digital Pickup Passes ({orderHistory.length})
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-stone-900 text-white overflow-hidden py-16 lg:py-24">
        {/* Background Gemini Photo Overlay */}
        <div className="absolute inset-0 z-0 opacity-35">
          <img 
            src="public/images/hero.png" 
            alt="Esther's Bookshop Storefront" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/90 to-transparent z-1"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-6 badge-pulse">
              <i data-lucide="sparkles" className="w-3.5 h-3.5 text-amber-300"></i>
              Boston's Premier Literary Storefront
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-amber-50 leading-[1.1]">
              Curated Reads. <br/>
              <span className="italic font-normal text-amber-200">Pick Up Today.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed font-light">
              Order your favorite paperbacks, hardcovers, and staff picks online. Pay digitally or at the door, and grab your books at Esther's Express Pickup Counter in under an hour.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <a 
                href="#catalog"
                className="px-6 py-3.5 rounded-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
              >
                <i data-lucide="book" className="w-4 h-4"></i>
                Browse Pickup Catalog
              </a>
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-amber-100 border border-amber-200/20 font-semibold text-sm transition flex items-center gap-2"
              >
                <i data-lucide="qr-code" className="w-4 h-4 text-amber-300"></i>
                Lookup Digital Pass
              </button>
            </div>

            {/* Quick Feature Badges */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-stone-800 pt-6 text-stone-300 text-xs">
              <div className="flex items-center gap-2">
                <i data-lucide="clock" className="w-4 h-4 text-amber-400"></i>
                <span>Ready in ~45 min</span>
              </div>
              <div className="flex items-center gap-2">
                <i data-lucide="credit-card" className="w-4 h-4 text-amber-400"></i>
                <span>Pay Now or Later</span>
              </div>
              <div className="flex items-center gap-2">
                <i data-lucide="qr-code" className="w-4 h-4 text-amber-400"></i>
                <span>Digital QR Pass</span>
              </div>
              <div className="flex items-center gap-2">
                <i data-lucide="coffee" className="w-4 h-4 text-amber-400"></i>
                <span>Complimentary Drink</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IN-STORE PICKUP WORKS SECTION */}
      <section className="bg-amber-900/5 border-y border-amber-900/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">How In-Store Pickup Works</h2>
            <p className="text-stone-600 text-sm mt-1">Simple 3-step order process with instant QR code pickup pass</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Select Books & Time</h3>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">Choose your titles, specify hardcover or paperback, and select your preferred pickup time slot.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Pay Online or at Store</h3>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">Complete payment via card or choose to pay cash/card at our express pickup counter.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Scan QR & Grab Order</h3>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">Show your Digital QR Pass at Esther's front counter. Enjoy your fresh books and free espresso!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        
        {/* Catalog Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-3xl font-bold text-stone-900">Explore Esther's Collection</h2>
            <p className="text-stone-600 text-sm mt-1">Showing {filteredBooks.length} available titles for local pickup</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* In Stock Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer bg-white px-3.5 py-2 rounded-lg border border-stone-200 shadow-sm">
              <input 
                type="checkbox" 
                checked={inStockOnly} 
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-amber-800 focus:ring-amber-800"
              />
              In Stock Only
            </label>

            {/* Sort Selector */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-stone-200 text-stone-800 text-xs font-semibold rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-800/20"
            >
              <option value="featured">Sort: Featured Picks</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="price-low">Sort: Price (Low to High)</option>
              <option value="price-high">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Genre Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedGenre === genre
                  ? 'bg-amber-900 text-amber-50 shadow-md shadow-amber-900/20'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* BOOK GRID */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
            <i data-lucide="book-x" className="w-12 h-12 text-stone-300 mx-auto mb-3"></i>
            <h3 className="font-serif text-xl font-bold text-stone-800">No books found</h3>
            <p className="text-stone-500 text-sm mt-1">Try adjusting your search query or genre filter.</p>
            <button 
              onClick={() => { setSelectedGenre('All'); setSearchQuery(''); setInStockOnly(false); }}
              className="mt-4 px-4 py-2 bg-amber-900 text-amber-100 text-xs font-bold rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBooks.map(book => (
              <div 
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-card-hover group cursor-pointer flex flex-col"
              >
                {/* Book Cover Image */}
                <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                  <img 
                    src={book.coverImage} 
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  {book.badge && (
                    <span className="absolute top-3 left-3 bg-amber-900 text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow">
                      {book.badge}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-stone-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                    {book.format}
                  </span>
                </div>

                {/* Book Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-xs text-amber-800 font-semibold mb-1">
                      <span>{book.genre}</span>
                      <span className="flex items-center gap-1 text-stone-600 font-normal">
                        <i data-lucide="star" className="w-3 h-3 fill-amber-400 text-amber-400"></i>
                        {book.rating} ({book.reviewsCount})
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-800 transition line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">by {book.author}</p>
                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                      {book.synopsis}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-amber-950">${book.price.toFixed(2)}</span>
                      {book.originalPrice && (
                        <span className="text-xs text-stone-400 line-through ml-2">${book.originalPrice.toFixed(2)}</span>
                      )}
                    </div>

                    <button 
                      onClick={(e) => addToCart(book, book.format, e)}
                      className="px-3.5 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-amber-50 text-xs font-semibold flex items-center gap-1.5 transition shadow"
                    >
                      <i data-lucide="plus" className="w-3.5 h-3.5"></i>
                      <span>Add for Pickup</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </section>

      {/* FOOTER */}
      <footer className="bg-stone-950 text-stone-400 text-xs py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-amber-100 font-serif text-xl font-bold mb-3">
              <i data-lucide="book-open" className="w-5 h-5 text-amber-500"></i>
              Esther's Bookshop
            </div>
            <p className="text-stone-400 leading-relaxed">
              Boutique bookstore in Boston offering online ordering, fast in-store pickup, and a cozy reading lounge.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-200 uppercase tracking-wider mb-3">Flagship Location</h4>
            <p className="leading-relaxed">428 Literary Avenue, Suite 100<br/>Boston, MA 02108<br/>(617) 555-BOOK</p>
          </div>

          <div>
            <h4 className="font-bold text-stone-200 uppercase tracking-wider mb-3">Pickup Hours</h4>
            <p className="leading-relaxed">Monday - Saturday: 8 AM - 8 PM<br/>Sunday: 10 AM - 6 PM</p>
          </div>

          <div>
            <h4 className="font-bold text-stone-200 uppercase tracking-wider mb-3">Hosted & Secured</h4>
            <p className="leading-relaxed text-stone-400">
              Ready for immediate static deployment on Vercel.<br/>Digital QR passes saved locally on device.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-stone-900 text-center text-stone-500">
          © 2026 Esther's Bookshop. Built with Gemini AI Photography & Vercel.
        </div>
      </footer>

      {/* MODAL: BOOK DETAIL VIEW */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col md:flex-row">
            
            {/* Left Cover Image */}
            <div className="md:w-1/2 bg-stone-100 relative p-6 flex items-center justify-center">
              <img src={selectedBook.coverImage} alt={selectedBook.title} className="max-h-72 md:max-h-96 object-contain shadow-book rounded-lg" />
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 md:hidden w-8 h-8 rounded-full bg-white/80 text-stone-800 flex items-center justify-center"
              >
                <i data-lucide="x" className="w-4 h-4"></i>
              </button>
            </div>

            {/* Right Details */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">{selectedBook.genre}</span>
                    <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">{selectedBook.title}</h2>
                    <p className="text-xs font-semibold text-stone-500">by {selectedBook.author}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedBook(null)}
                    className="hidden md:flex w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 items-center justify-center"
                  >
                    <i data-lucide="x" className="w-4 h-4"></i>
                  </button>
                </div>

                <p className="text-xs text-stone-600 mt-4 leading-relaxed">{selectedBook.synopsis}</p>

                <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px] text-stone-500">
                  <div>Format: <strong className="text-stone-800">{selectedBook.format}</strong></div>
                  <div>Pages: <strong className="text-stone-800">{selectedBook.pages}</strong></div>
                  <div>ISBN: <strong className="text-stone-800">{selectedBook.isbn}</strong></div>
                  <div>In Stock: <strong className="text-emerald-700">{selectedBook.stock} available</strong></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-amber-950">${selectedBook.price.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => { addToCart(selectedBook, selectedBook.format); setSelectedBook(null); }}
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-50 rounded-xl font-bold text-xs shadow-md"
                >
                  Add for In-Store Pickup
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CART SLIDE-OVER DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Cart Header */}
              <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <i data-lucide="shopping-bag" className="w-5 h-5 text-amber-800"></i>
                  <h2 className="font-serif text-xl font-bold text-stone-900">Your Pickup Cart</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <i data-lucide="x" className="w-5 h-5"></i>
                </button>
              </div>

              {/* Cart Items List */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-stone-500">
                    <i data-lucide="shopping-cart" className="w-12 h-12 text-stone-300 mx-auto mb-3"></i>
                    <p className="font-serif text-lg text-stone-700 font-bold">Your cart is empty</p>
                    <p className="text-xs mt-1">Browse Esther's catalog and select books for local pickup.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={`${item.id}-${item.format}`} className="flex gap-4 p-3 rounded-xl border border-stone-200 bg-stone-50/50">
                      <img src={item.coverImage} alt={item.title} className="w-14 h-18 object-cover rounded shadow-sm" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{item.title}</h4>
                            <button onClick={() => removeFromCart(item.id, item.format)} className="text-stone-400 hover:text-red-600 text-xs">
                              <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                          <p className="text-[11px] text-stone-500">{item.format} • ${item.price.toFixed(2)}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-stone-300 rounded bg-white">
                            <button onClick={() => updateQuantity(item.id, item.format, -1)} className="px-2 py-0.5 text-xs text-stone-600">-</button>
                            <span className="px-2 text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.format, 1)} className="px-2 py-0.5 text-xs text-stone-600">+</button>
                          </div>
                          <span className="font-bold text-xs text-amber-950">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-stone-200 bg-stone-50 space-y-4">
                  <div className="space-y-1 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-900">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Sales Tax (6.25%)</span>
                      <span>${estimatedTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-amber-950 pt-2 border-t border-stone-200">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full py-3.5 bg-amber-900 hover:bg-amber-950 text-amber-50 font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <i data-lucide="calendar" className="w-4 h-4"></i>
                    Schedule Pickup & Pay
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8">
            
            <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">In-Store Pickup & Payment</h2>
                <p className="text-xs text-stone-500">Configure pickup location and payment details</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-stone-400 hover:text-stone-600">
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-6 text-xs">
              
              {/* 1. Pickup Store Selector */}
              <div>
                <label className="font-bold text-stone-800 uppercase tracking-wider block mb-2">1. Select Pickup Store Location</label>
                <div className="grid grid-cols-1 gap-3">
                  {STORE_LOCATIONS.map(store => (
                    <div 
                      key={store.id}
                      onClick={() => setSelectedStore(store.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                        selectedStore === store.id ? 'border-amber-800 bg-amber-950/5 ring-1 ring-amber-800' : 'border-stone-200 bg-white'
                      }`}
                    >
                      <div>
                        <h4 className="font-bold text-stone-900 text-xs">{store.name}</h4>
                        <p className="text-stone-500 text-[11px] mt-0.5">{store.address}</p>
                        <span className="inline-block mt-2 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {store.readyTime}
                        </span>
                      </div>
                      <input type="radio" checked={selectedStore === store.id} readOnly className="mt-1 text-amber-800" />
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Pickup Time Slot */}
              <div>
                <label className="font-bold text-stone-800 uppercase tracking-wider block mb-2">2. Preferred Pickup Time Slot</label>
                <select 
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 font-semibold text-stone-800 bg-stone-50"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              {/* 3. Contact Info */}
              <div>
                <label className="font-bold text-stone-800 uppercase tracking-wider block mb-2">3. Pickup Contact Details</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="Full Name *" 
                    required 
                    value={customerInfo.name} 
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="p-3 border border-stone-200 rounded-xl bg-stone-50 text-xs" 
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address *" 
                    required 
                    value={customerInfo.email} 
                    onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="p-3 border border-stone-200 rounded-xl bg-stone-50 text-xs" 
                  />
                  <input 
                    type="tel" 
                    placeholder="Mobile Phone (for SMS alert) *" 
                    required 
                    value={customerInfo.phone} 
                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="p-3 border border-stone-200 rounded-xl bg-stone-50 text-xs sm:col-span-2" 
                  />
                </div>
              </div>

              {/* 4. Payment Method */}
              <div>
                <label className="font-bold text-stone-800 uppercase tracking-wider block mb-2">4. Payment Method</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 text-center rounded-xl border font-bold ${paymentMethod === 'card' ? 'border-amber-800 bg-amber-900 text-amber-50' : 'border-stone-200 text-stone-700 bg-white'}`}
                  >
                    Credit Card
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('mobile')}
                    className={`p-2.5 text-center rounded-xl border font-bold ${paymentMethod === 'mobile' ? 'border-amber-800 bg-amber-900 text-amber-50' : 'border-stone-200 text-stone-700 bg-white'}`}
                  >
                    Apple / Google Pay
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('pickup')}
                    className={`p-2.5 text-center rounded-xl border font-bold ${paymentMethod === 'pickup' ? 'border-amber-800 bg-amber-900 text-amber-50' : 'border-stone-200 text-stone-700 bg-white'}`}
                  >
                    Pay at Store
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Total Due</span>
                  <span className="text-xl font-bold text-amber-950">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  type="submit"
                  className="px-6 py-3.5 bg-amber-900 hover:bg-amber-950 text-amber-50 font-bold rounded-xl shadow-lg flex items-center gap-2"
                >
                  <i data-lucide="check-circle" className="w-4 h-4"></i>
                  Confirm Order & Generate Pass
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DIGITAL PICKUP PASS & RECEIPT MODAL */}
      {isOrderReceiptOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-stone-200 my-8">
            
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="check" className="w-8 h-8"></i>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              In-Store Pickup Pass Confirmed
            </span>

            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-3">Order #{activeOrder.orderId}</h2>
            <p className="text-xs text-stone-500 mt-1">Show this QR pass to Esther's counter staff upon arrival</p>

            {/* Generated QR Code Canvas */}
            <div className="my-6 flex justify-center">
              <div ref={qrRef} className="qr-container shadow-inner"></div>
            </div>

            {/* Order Details */}
            <div className="bg-stone-50 p-4 rounded-xl text-left space-y-2 text-xs border border-stone-200">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Pickup Location:</span>
                <span className="font-bold text-stone-900">{activeOrder.store.name}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Scheduled Slot:</span>
                <span className="font-bold text-amber-900">{activeOrder.timeSlot}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Contact Name:</span>
                <span className="font-semibold text-stone-800">{activeOrder.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Items:</span>
                <span className="font-bold text-stone-900">{activeOrder.items.length} book(s) (${activeOrder.total.toFixed(2)})</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
              >
                Print Pass
              </button>
              <button 
                onClick={() => setIsOrderReceiptOpen(false)}
                className="flex-1 py-3 bg-amber-900 hover:bg-amber-950 text-amber-50 font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ORDER HISTORY MODAL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-stone-200">
              <h3 className="font-serif text-xl font-bold text-stone-900">My Pickup Passes</h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-stone-400 hover:text-stone-600">
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {orderHistory.length === 0 ? (
                <p className="text-center text-stone-500 py-8">No past pickup orders found.</p>
              ) : (
                orderHistory.map(ord => (
                  <div key={ord.orderId} className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-stone-900">Order #{ord.orderId}</h4>
                      <p className="text-stone-500 text-[11px]">{ord.createdAt}</p>
                      <p className="text-amber-900 font-semibold mt-1">{ord.timeSlot}</p>
                    </div>
                    <button 
                      onClick={() => { setActiveOrder(ord); setIsHistoryOpen(false); setIsOrderReceiptOpen(true); }}
                      className="px-3 py-1.5 bg-amber-900 text-amber-50 font-bold rounded-lg text-xs"
                    >
                      View QR
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-100 px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center gap-3 text-xs font-semibold animate-slide-up">
          <i data-lucide="check-circle-2" className="w-4 h-4 text-amber-400"></i>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// Render React App into DOM
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<EstherBookshopApp />);
}
