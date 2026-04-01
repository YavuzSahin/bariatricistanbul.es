"""
Bariatric Istanbul - New Features Tests (Iteration 5)
Tests for: Upload endpoint, Admin English UI, Legal pages, Footer links, Contact info, WhatsApp links, No prices
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-intake-22.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@bariatricistanbul.com"
ADMIN_PASSWORD = "admin123"


class TestUploadEndpoint:
    """Test POST /api/upload endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_upload_requires_auth(self):
        """Test upload endpoint requires authentication"""
        # Create a fake file
        files = {'file': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 401
        print("✓ Upload endpoint requires authentication")
    
    def test_upload_image_with_auth(self, auth_token):
        """Test upload image with valid auth token"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a minimal valid JPEG (smallest valid JPEG)
        # This is a 1x1 pixel red JPEG
        jpeg_bytes = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF1, 0x7E, 0xA9,
            0x00, 0x00, 0x00, 0x00, 0xFF, 0xD9
        ])
        
        files = {'file': ('test_upload.jpg', jpeg_bytes, 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "filename" in data
        assert data["url"].startswith("/api/uploads/")
        assert data["filename"].endswith(".jpg")
        print(f"✓ Upload successful: {data['url']}")
        
        # Verify file is accessible
        file_url = f"{BASE_URL}{data['url']}"
        file_response = requests.get(file_url)
        assert file_response.status_code == 200
        print(f"✓ Uploaded file is accessible at {data['url']}")
    
    def test_upload_rejects_invalid_file_type(self, auth_token):
        """Test upload rejects non-allowed file types"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        files = {'file': ('test.exe', b'fake executable content', 'application/octet-stream')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=headers)
        assert response.status_code == 400
        data = response.json()
        assert "not allowed" in data["detail"].lower()
        print("✓ Upload rejects invalid file types (.exe)")
    
    def test_upload_accepts_video(self, auth_token):
        """Test upload accepts video files"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        # Minimal MP4 header
        mp4_bytes = b'\x00\x00\x00\x1c\x66\x74\x79\x70\x69\x73\x6f\x6d\x00\x00\x02\x00'
        files = {'file': ('test_video.mp4', mp4_bytes, 'video/mp4')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["url"].startswith("/api/uploads/")
        assert data["filename"].endswith(".mp4")
        print(f"✓ Video upload successful: {data['url']}")


class TestStaticUploads:
    """Test static file serving from /api/uploads/"""
    
    def test_uploads_directory_exists(self):
        """Test that uploads directory is mounted"""
        # Try to access a non-existent file - should return 404, not 500
        response = requests.get(f"{BASE_URL}/api/uploads/nonexistent.jpg")
        # 404 means the route exists but file doesn't
        assert response.status_code == 404
        print("✓ /api/uploads/ route is mounted correctly")


class TestContentEndpoints:
    """Test content endpoints return expected data"""
    
    def test_transformations_no_prices(self):
        """Test transformations don't contain euro prices"""
        response = requests.get(f"{BASE_URL}/api/content/transformations")
        assert response.status_code == 200
        data = response.json()
        for item in data:
            # Check no euro symbol in any field
            for key, value in item.items():
                if isinstance(value, str):
                    assert "€" not in value, f"Found euro symbol in {key}"
        print("✓ Transformations contain no euro prices")
    
    def test_blog_no_specific_prices(self):
        """Test blog posts don't contain specific euro prices"""
        response = requests.get(f"{BASE_URL}/api/content/blog")
        assert response.status_code == 200
        data = response.json()
        for post in data:
            content = post.get("content", "")
            # Check for specific price patterns like "3.500€" or "€3500"
            assert "3.500€" not in content, "Found specific price in blog content"
            assert "€3.500" not in content, "Found specific price in blog content"
            assert "4.500€" not in content, "Found specific price in blog content"
        print("✓ Blog posts don't contain specific euro prices")


class TestSiteSettings:
    """Test site settings endpoint"""
    
    def test_get_settings(self):
        """Test GET settings returns expected structure"""
        response = requests.get(f"{BASE_URL}/api/content/settings")
        assert response.status_code == 200
        data = response.json()
        # Check expected fields exist
        expected_fields = ["site_title", "site_description", "phone", "email", "whatsapp_link", "address"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print("✓ Settings endpoint returns expected structure")


class TestSitemapBlogSlugs:
    """Test sitemap contains correct blog slugs"""
    
    def test_sitemap_has_correct_slugs(self):
        """Test sitemap contains the seeded blog post slugs"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        content = response.text
        
        # Check for expected slugs (from seeded data)
        expected_slugs = [
            "manga-gastrica-turquia-guia-completa",
            "bypass-gastrico-vs-manga-gastrica",
            "precios-cirugia-bariatrica-turquia"
        ]
        
        for slug in expected_slugs:
            assert slug in content, f"Missing slug in sitemap: {slug}"
        
        print("✓ Sitemap contains all expected blog slugs")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
