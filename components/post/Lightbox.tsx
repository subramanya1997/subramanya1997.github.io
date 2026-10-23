// Image lightbox modal driven by /assets/js/post-scripts.js (click any image
// in `.post-content`). Shared by the post and handbook layouts.
export default function Lightbox() {
  return (
    <>
      {/* Image Lightbox Modal */}
      <div className="image-lightbox" id="imageLightbox">
        <span className="lightbox-close" id="lightboxClose">
          &times;
        </span>
        {/* React drops an empty `src`, which the lightbox script sets at runtime. */}
        <div
          className="lightbox-content"
          dangerouslySetInnerHTML={{
            __html:
              '\n    <img class="lightbox-image" id="lightboxImage" data-proofer-ignore src="" alt="">\n  ',
          }}
        />
        <div className="lightbox-controls">
          <button className="lightbox-control-btn" id="zoomIn" title="Zoom In">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button className="lightbox-control-btn" id="zoomOut" title="Zoom Out">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button className="lightbox-control-btn" id="resetZoom" title="Reset">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
