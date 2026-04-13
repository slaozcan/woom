import { useState, useEffect, useRef } from 'react';
import { addContent, subscribeToContents, uploadImage, compressImage, rateContent, deleteContent, commentContent } from './firebase';
import './App.css'; // EN ÖNEMLİ EKSİK BURADAYDI!

const categoryIcons = {
  kitap: '📚',
  dizi: '📺',
  film: '🎬',
  fotograf: '📷'
};

const StarRating = ({ rating, onRate, interactive = true }) => {
  return (
    <div className="ios-star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`ios-star ${star <= rating ? 'filled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if(interactive) onRate(star);
          }}
          disabled={!interactive}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ContentCard = ({ content, currentUser }) => {
  const isOwner = content.user === currentUser;
  const partnerUser = content.user === 'sila' ? 'seray' : 'sila';
  const partnerCommentText = content.comments?.[partnerUser];
  
  const ownerRating = content.rating || 0;
  
  const [isCommenting, setIsCommenting] = useState(false);
  const [draftComment, setDraftComment] = useState(content.comments?.[currentUser] || '');
  
  const dateStr = new Date(content.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
     setDraftComment(content.comments?.[currentUser] || '');
  }, [content.comments, currentUser]);

  const handleRate = async (star, targetUser) => {
    if (targetUser !== currentUser) return; // Sadece kendi alanını puanlayabilir
    try {
      await rateContent(content.id, currentUser, star);
    } catch (error) {
      alert('Puanlama hatası!');
    }
  };

  const handleSaveComment = async () => {
    if (!draftComment.trim()) return;
    try {
      await commentContent(content.id, currentUser, draftComment.trim());
      setIsCommenting(false);
    } catch (error) {
      alert('Yorum ekleme hatası!');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;
    try {
      await deleteContent(content.id);
    } catch (error) {
      alert('Silme hatası!');
    }
  };

  return (
    <div className={`ios-card ${content.user === 'sila' ? 'sila-border' : 'seray-border'}`}>
      <div className="ios-card-inner">
        {content.imageUrl && (
          <div className="ios-card-image">
            <img src={content.imageUrl} alt={content.title} loading="lazy" />
          </div>
        )}
        <div className="ios-card-content">
          <div className="ios-card-header">
            <span className="ios-card-category">{categoryIcons[content.category]}</span>
            {isOwner && (
              <button className="ios-delete-btn" onClick={handleDelete}>Sil</button>
            )}
          </div>
          
          <h3 className="ios-card-title">{content.title}</h3>
          
          <div className="ios-ratings-container">
              <div className="ios-rating-row">
                  <span className="ios-rating-label">👩🏼 Sıla'nın Puanı</span>
                  <StarRating 
                      rating={content.user === 'sila' ? ownerRating : (content.ratings?.['sila'] || 0)} 
                      onRate={(star) => handleRate(star, 'sila')} 
                      interactive={currentUser === 'sila' && content.user !== 'sila'} 
                  />
              </div>
              <div className="ios-rating-row">
                  <span className="ios-rating-label">👩🏽 Seray'ın Puanı</span>
                  <StarRating 
                      rating={content.user === 'seray' ? ownerRating : (content.ratings?.['seray'] || 0)} 
                      onRate={(star) => handleRate(star, 'seray')} 
                      interactive={currentUser === 'seray' && content.user !== 'seray'} 
                  />
              </div>
          </div>

          <div className="ios-comments-container">
              {content.comment && (
                  <div className={`ios-comment-box ${content.user}-comment`}>
                      <span className="comment-author">{content.user === 'sila' ? '👩🏼 Sıla' : '👩🏽 Seray'}</span>
                      <p>"{content.comment}"</p>
                  </div>
              )}

              {partnerCommentText ? (
                  <div className={`ios-comment-box ${partnerUser}-comment partner-comment`}>
                      <span className="comment-author">{partnerUser === 'sila' ? '👩🏼 Sıla' : '👩🏽 Seray'}</span>
                      <p>"{partnerCommentText}"</p>
                      {!isOwner && (
                          <button className="ios-edit-comment-btn" onClick={() => setIsCommenting(true)}>Düzenle</button>
                      )}
                  </div>
              ) : null}

              {!isOwner && !partnerCommentText && !isCommenting && (
                  <button className="ios-add-comment-btn" onClick={() => setIsCommenting(true)}>
                      + Yorum Ekle
                  </button>
              )}

              {!isOwner && isCommenting && (
                  <div className="ios-add-comment-box">
                      <textarea 
                          value={draftComment}
                          onChange={(e) => setDraftComment(e.target.value)}
                          placeholder="Yorumunu yaz..."
                          className="ios-textarea-small"
                          rows={2}
                      />
                      <div className="ios-comment-actions">
                          <button onClick={() => { setIsCommenting(false); setDraftComment(content.comments?.[currentUser] || ''); }}>İptal</button>
                          <button className="bold" onClick={handleSaveComment}>Kaydet</button>
                      </div>
                  </div>
              )}
          </div>
          <div style={{marginTop: '12px'}}>
              <span className="ios-card-date">{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserSelection = ({ onSelect }) => (
  <div className="ios-user-selection">
    <div className="ios-branding">
        <h1 className="ios-main-title">WOOM</h1>
        <p className="ios-sub-title">What's On Our Minds</p>
    </div>
    <div className="ios-selection-list">
        <p className="ios-list-header">GİRİŞ YAP</p>
        <button className="ios-list-item" onClick={() => onSelect('sila')}>
            <div className="avatar-wrapper sila-gradient">
              <img src="/avatars/sila.jpg" alt="Sıla" className="ios-avatar-thumb" />
            </div>
            <span className="ios-item-text">Sıla Olarak Devam Et</span>
            <span className="ios-chevron">›</span>
        </button>
        <button className="ios-list-item" onClick={() => onSelect('seray')}>
            <div className="avatar-wrapper seray-gradient">
              <img src="/avatars/seray.jpg" alt="Seray" className="ios-avatar-thumb" />
            </div>
            <span className="ios-item-text">Seray Olarak Devam Et</span>
            <span className="ios-chevron">›</span>
        </button>
    </div>
  </div>
);

const AddContentSheet = ({ isOpen, onClose, currentUser }) => {
  const [category, setCategory] = useState('kitap');
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
    const compressedFile = await compressImage(file);
    setSelectedImage(compressedFile);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage, currentUser);
      }
      await addContent({ user: currentUser, category, title: title.trim(), rating, comment: comment.trim(), imageUrl });
      
      setCategory('kitap');
      setTitle('');
      setRating(0);
      setComment('');
      setSelectedImage(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error('Ekleme hatası:', error);
      alert('İçerik eklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`ios-sheet-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className={`ios-sheet ${isOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="ios-sheet-handle"></div>
        <div className="ios-sheet-header">
            <button className="ios-header-btn-text" onClick={onClose}>İptal</button>
            <h2 className="ios-sheet-title">Yeni İçerik</h2>
            <button 
                className="ios-header-btn-text bold" 
                onClick={handleSubmit}
                disabled={isLoading || !title.trim()}
            >
                {isLoading ? '...' : 'Ekle'}
            </button>
        </div>
        
        <div className="ios-sheet-content">
            <div className="ios-form-group">
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Başlık" 
                    className="ios-input-large" 
                />
            </div>

            <div className="ios-photo-adder" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                    <div className="ios-photo-preview">
                        <img src={imagePreview} alt="Seçilen Fotoğraf" />
                        <button className="ios-photo-remove" onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedImage(null); 
                            setImagePreview(null); 
                        }}>Kaldır</button>
                    </div>
                ) : (
                    <div className="ios-photo-placeholder">
                        <span className="ios-icon-camera">📷</span>
                        <span>Fotoğraf Ekle</span>
                    </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageSelect} ref={fileInputRef} hidden />
            </div>

            <p className="ios-list-header">KATEGORİ</p>
            <div className="ios-category-picker">
              {Object.entries(categoryIcons).map(([key, icon]) => (
                <button 
                    key={key} 
                    className={`ios-cat-btn ${category === key ? 'active' : ''}`}
                    onClick={() => setCategory(key)}
                >
                  <span className="ios-cat-icon">{icon}</span>
                  <span className="ios-cat-text">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </button>
              ))}
            </div>

            <p className="ios-list-header">PUAN</p>
            <div className="ios-grouped-list">
                <div className="ios-list-item center">
                    <StarRating rating={rating} onRate={setRating} />
                </div>
            </div>

            <p className="ios-list-header">YORUM</p>
            <div className="ios-grouped-list">
                <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Düşüncelerini yaz..." 
                    className="ios-textarea" 
                    rows={4} 
                />
            </div>
            
            <div className="ios-sheet-spacer"></div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ currentUser, onLogout }) => {
  const [contents, setContents] = useState([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const unsubscribe = subscribeToContents(setContents);
    return () => unsubscribe();
  }, []);

  const silaContents = contents.filter(c => c.user === 'sila');
  const serayContents = contents.filter(c => c.user === 'seray');

  const getUserAvatar = () => {
    if (currentUser === 'sila') return '/avatars/sila.jpg';
    return '/avatars/seray.jpg';
  };

  return (
    <div className="ios-app-container">
      <nav className="ios-nav-bar">
        <div className="ios-nav-top">
          <button className="ios-header-btn-text" onClick={onLogout}>Çıkış</button>
          
          <div className="ios-nav-profile">
            <img src={getUserAvatar()} alt="Profile" className="ios-nav-avatar" />
            <span className="ios-nav-user">{currentUser === 'sila' ? 'Sıla' : 'Seray'}</span>
          </div>

          <button className="ios-header-add-button" onClick={() => setIsSheetOpen(true)}>
            +
          </button>
        </div>
        
        <div className="ios-segmented-control">
          <div className={`ios-segment-bg position-${activeTab}`}></div>
          <button className={`ios-segment ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>İkisi</button>
          <button className={`ios-segment ${activeTab === 'sila' ? 'active' : ''}`} onClick={() => setActiveTab('sila')}>Sıla</button>
          <button className={`ios-segment ${activeTab === 'seray' ? 'active' : ''}`} onClick={() => setActiveTab('seray')}>Seray</button>
        </div>
      </nav>

      <main className="ios-main-content">
        {activeTab === 'all' ? (
          <div className="split-view">
            <section className="column sila-column">
              <div className="column-header sila-header">
                <img src="/avatars/sila.jpg" alt="Sıla" className="column-avatar-img" />
                <span className="column-name">Sıla</span>
                <span className="ios-count-badge">{silaContents.length}</span>
              </div>
              <div className="column-feed">
                {silaContents.length === 0 ? <p className="empty-feed">İçerik Yok</p> : 
                  silaContents.map(c => <ContentCard key={c.id} content={c} currentUser={currentUser} />)
                }
              </div>
            </section>
            
            <div className="split-divider"></div>
            
            <section className="column seray-column">
              <div className="column-header seray-header">
                <img src="/avatars/seray.jpg" alt="Seray" className="column-avatar-img" />
                <span className="column-name">Seray</span>
                <span className="ios-count-badge">{serayContents.length}</span>
              </div>
              <div className="column-feed">
                {serayContents.length === 0 ? <p className="empty-feed">İçerik Yok</p> : 
                  serayContents.map(c => <ContentCard key={c.id} content={c} currentUser={currentUser} />)
                }
              </div>
            </section>
          </div>
        ) : (
          <div className="single-feed">
             <div className="column-header single-header">
                <img src={`/avatars/${activeTab}.jpg`} alt={activeTab} className="column-avatar-img" />
                <span className="column-name">{activeTab === 'sila' ? 'Sıla' : 'Seray'} İçerikleri</span>
                <span className="ios-count-badge">{activeTab === 'sila' ? silaContents.length : serayContents.length}</span>
             </div>
             <div className="ios-feed">
                {(activeTab === 'sila' ? silaContents : serayContents).length === 0 ? (
                  <div className="ios-empty-state"><p>Henüz içerik yok</p></div>
                ) : (
                  (activeTab === 'sila' ? silaContents : serayContents).map(c => (
                    <ContentCard key={c.id} content={c} currentUser={currentUser} />
                  ))
                )}
             </div>
          </div>
        )}
      </main>

      <AddContentSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} currentUser={currentUser} />
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('selectedUser') || null);

  const handleUserSelect = (user) => {
    localStorage.setItem('selectedUser', user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('selectedUser');
    setCurrentUser(null);
  };

  return (
    <div className="ios-root">
      <div className="ios-mobile-constraint">
        {currentUser
          ? <Dashboard currentUser={currentUser} onLogout={handleLogout} />
          : <UserSelection onSelect={handleUserSelect} />}
      </div>
    </div>
  );
}

export default App;