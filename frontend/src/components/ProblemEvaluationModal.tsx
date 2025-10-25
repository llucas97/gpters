import React, { useState } from 'react';
import './ProblemEvaluationModal.css';

interface ProblemEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: number;
  userId: string;
  onSubmitSuccess?: () => void;
}

const ProblemEvaluationModal: React.FC<ProblemEvaluationModalProps> = ({
  isOpen,
  onClose,
  problemId,
  userId,
  onSubmitSuccess
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [showReportForm, setShowReportForm] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      alert('평가 점수를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/problem-evaluation/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          problemId,
          rating,
          feedback: feedback.trim() || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('평가가 제출되었습니다. 감사합니다!');
        onSubmitSuccess?.();
        handleClose();
      } else {
        alert(`평가 제출 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('평가 제출 오류:', error);
      alert('평가 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      alert('신고 사유를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/problem-evaluation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          problemId,
          reportReason: reportReason.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('신고가 접수되었습니다. 관리자가 검토할 예정입니다.');
        onSubmitSuccess?.();
        handleClose();
      } else {
        alert(`신고 접수 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('신고 접수 오류:', error);
      alert('신고 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setFeedback('');
    setShowReportForm(false);
    setReportReason('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{showReportForm ? '문제 신고하기' : '문제 평가하기'}</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {!showReportForm ? (
          <>
            {/* 평가 폼 */}
            <div className="modal-body">
              <div className="rating-section">
                <label className="section-label">이 문제는 어떠셨나요?</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${
                        star <= (hoverRating || rating) ? 'active' : ''
                      }`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="rating-labels">
                  <span>매우 나쁨</span>
                  <span>매우 좋음</span>
                </div>
              </div>

              <div className="feedback-section">
                <label className="section-label">
                  피드백 (선택사항)
                </label>
                <textarea
                  className="feedback-textarea"
                  placeholder="이 문제에 대한 의견을 남겨주세요..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <div className="char-count">{feedback.length}/500</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowReportForm(true)}
              >
                문제 신고하기
              </button>
              <button
                className="btn-primary"
                onClick={handleRatingSubmit}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? '제출 중...' : '평가 제출'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 신고 폼 */}
            <div className="modal-body">
              <div className="report-section">
                <label className="section-label">신고 사유</label>
                <textarea
                  className="feedback-textarea report-textarea"
                  placeholder="문제의 오류, 부적절한 내용 등을 구체적으로 설명해주세요..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={6}
                  maxLength={1000}
                />
                <div className="char-count">{reportReason.length}/1000</div>
                <p className="report-notice">
                  ⚠️ 신고 내용은 관리자가 검토합니다. 허위 신고 시 불이익이 있을 수 있습니다.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowReportForm(false)}
              >
                평가하기로 돌아가기
              </button>
              <button
                className="btn-danger"
                onClick={handleReportSubmit}
                disabled={isSubmitting || !reportReason.trim()}
              >
                {isSubmitting ? '신고 중...' : '신고 제출'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProblemEvaluationModal;

