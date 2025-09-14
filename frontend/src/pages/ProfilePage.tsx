import React, { useState, useRef, useEffect } from 'react';
import './ProfilePage.css';
import { fetchProfile, updateProfile } from '../api/profile';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: string;
}

// API 호출 함수들
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// const fetchProfile = async (userId: string): Promise<UserProfile> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
    
//     if (!response.ok) {
//       throw new Error('프로필을 불러올 수 없습니다.');
//     }

//     const result = await response.json();
//     return result.data;
//   } catch (error) {
//     console.error('Profile fetch error:', error);
//     throw error;
//   }
// };

// const updateProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(profileData),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || '프로필 업데이트에 실패했습니다.');
//     }

//     const result = await response.json();
//     return result.data;
//   } catch (error) {
//     console.error('Profile update error:', error);
//     throw error;
//   }
// };

// 이미지 업로드는 프로필 업데이트와 함께 처리됩니다

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 인증 확인 및 프로필 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const profileData = await fetchProfile();
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      setError('프로필을 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProfile) return;
    
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editedProfile) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        
        try {
          // 로컬 미리보기 표시 (실제 업로드는 저장 시 처리)
          setEditedProfile(prev => ({
            ...prev!,
            profileImage: imageData
          }));
        } catch (error) {
          console.error('이미지 처리 실패:', error);
          alert('이미지 처리 중 오류가 발생했습니다.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (!editedProfile || !profile) return;
    
    setIsSaving(true);
    try {
      const updatedProfile = await updateProfile({
        username: editedProfile.username,
        name: editedProfile.name,
        email: editedProfile.email,
        bio: editedProfile.bio,
        location: editedProfile.location,
        website: editedProfile.website,
        profileImage: editedProfile.profileImage
      });
      
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);
      setError(null);
      
      alert('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setError(`프로필 업데이트에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 로그인하지 않은 사용자 처리
  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8 col-xl-6">
              <div className="card profile-card">
                <div className="card-body p-4 text-center">
                  <h3>로그인이 필요합니다</h3>
                  <p className="text-muted">프로필을 보려면 먼저 로그인해주세요.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => navigate('/login')}
                  >
                    로그인하러 가기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8 col-xl-6">
              <div className="card profile-card">
                <div className="card-body p-4 text-center">
                  <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">로딩 중...</span>
                  </div>
                  <p className="mt-3 text-muted">프로필을 불러오는 중...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return (
      <div className="profile-page">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8 col-xl-6">
              <div className="card profile-card">
                <div className="card-body p-4 text-center">
                  <h3 className="text-danger">프로필을 불러올 수 없습니다</h3>
                  <p className="text-muted">잠시 후 다시 시도해주세요.</p>
                  <button className="btn btn-primary" onClick={loadProfile}>
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card profile-card">
              <div className="card-body p-4">
                {/* 에러 메시지 */}
                {error && (
                  <div className="alert alert-warning mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                {/* 헤더 */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="card-title mb-0">
                    <i className="bi bi-person-circle me-2"></i>
                    내 프로필
                  </h2>
                  {!isEditing && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      편집
                    </button>
                  )}
                </div>

                {/* 프로필 이미지 */}
                <div className="text-center mb-4">
                  <div className="profile-image-container position-relative d-inline-block">
                    <img
                      src={editedProfile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=120&background=6366f1&color=fff`}
                      alt="프로필 이미지"
                      className="profile-image rounded-circle"
                      width="120"
                      height="120"
                    />
                    {isEditing && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary profile-image-edit"
                        onClick={triggerFileInput}
                      >
                        <i className="bi bi-camera-fill"></i>
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  {isEditing && (
                    <p className="text-muted small mt-2">
                      프로필 사진을 변경하려면 이미지를 클릭하세요
                    </p>
                  )}
                </div>

                {/* 프로필 정보 폼 */}
                <form>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">이름</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={editedProfile.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="username" className="form-label">사용자명</label>
                      <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        value={editedProfile.username}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">이메일</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={editedProfile.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">자기소개</label>
                    <textarea
                      className="form-control"
                      id="bio"
                      name="bio"
                      rows={3}
                      value={editedProfile.bio || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="자신을 소개해보세요..."
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="location" className="form-label">위치</label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        name="location"
                        value={editedProfile.location || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="예: 서울, 대한민국"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="website" className="form-label">웹사이트</label>
                      <input
                        type="url"
                        className="form-control"
                        id="website"
                        name="website"
                        value={editedProfile.website || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">가입일</label>
                    <input
                      type="text"
                      className="form-control"
                      value={new Date(profile.joinDate).toLocaleDateString('ko-KR')}
                      disabled
                    />
                  </div>

                  {/* 편집 모드 버튼 */}
                  {isEditing && (
                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-primary flex-fill"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            저장 중...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-1"></i>
                            저장
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary flex-fill"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        <i className="bi bi-x-lg me-1"></i>
                        취소
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 