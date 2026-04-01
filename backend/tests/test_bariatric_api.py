"""
Bariatric Istanbul API Tests
Tests for: Auth, Content CRUD (Transformations, Testimonials, Videos, Itinerary, Surgeon, Hospital, Blog), Sitemap
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-intake-22.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@bariatricistanbul.com"
ADMIN_PASSWORD = "admin123"


class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint returns Spanish message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Bariatric Istanbul API" in data["message"]
        assert "Cirugía Bariátrica" in data["message"]
        print("✓ API root returns Spanish message")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert len(data["token"]) > 0
        print(f"✓ Admin login successful, token received")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("✓ Invalid credentials rejected with 401")
    
    def test_login_invalid_email(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("✓ Non-existent email rejected with 401")
    
    def test_auth_me_without_token(self):
        """Test /me endpoint without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /me without token returns 401")
    
    def test_auth_me_with_token(self):
        """Test /me endpoint with valid token"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["token"]
        
        # Then check /me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print("✓ /me with valid token returns user data")


class TestTransformations:
    """Transformations content CRUD tests"""
    
    def test_get_transformations(self):
        """Test GET transformations returns seeded data"""
        response = requests.get(f"{BASE_URL}/api/content/transformations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4  # Seeded data
        # Check structure
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "weight_lost" in item
            assert "months_post_op" in item
            assert "image_url" in item
        print(f"✓ GET transformations returns {len(data)} items")
    
    def test_create_transformation_requires_auth(self):
        """Test POST transformation without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/content/transformations", json={
            "weight_lost": "TEST_50kg",
            "months_post_op": "6 meses",
            "image_url": "https://test.com/image.jpg"
        })
        assert response.status_code == 401
        print("✓ POST transformation without auth returns 401")


class TestTestimonials:
    """Testimonials content tests"""
    
    def test_get_testimonials(self):
        """Test GET testimonials returns seeded data"""
        response = requests.get(f"{BASE_URL}/api/content/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Seeded data
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "name" in item
            assert "country" in item
            assert "text" in item
            assert "rating" in item
        print(f"✓ GET testimonials returns {len(data)} items")


class TestVideoTestimonials:
    """Video testimonials content tests"""
    
    def test_get_video_testimonials(self):
        """Test GET video-testimonials returns seeded data"""
        response = requests.get(f"{BASE_URL}/api/content/video-testimonials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Seeded data
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "title" in item
            assert "duration" in item
            assert "thumbnail_url" in item
            assert "video_url" in item
        print(f"✓ GET video-testimonials returns {len(data)} items")


class TestItinerary:
    """Itinerary content tests"""
    
    def test_get_itinerary(self):
        """Test GET itinerary returns seeded data sorted by day"""
        response = requests.get(f"{BASE_URL}/api/content/itinerary")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6  # Seeded 6 days
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "day_number" in item
            assert "title" in item
            assert "description" in item
            # Check sorted by day_number
            assert data[0]["day_number"] == 1
        print(f"✓ GET itinerary returns {len(data)} days sorted correctly")


class TestSurgeon:
    """Surgeon single-item content tests"""
    
    def test_get_surgeon(self):
        """Test GET surgeon returns seeded data"""
        response = requests.get(f"{BASE_URL}/api/content/surgeon")
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert "id" in data
        assert "name" in data
        assert "title" in data
        assert "bio" in data
        assert "image_url" in data
        assert "surgeries_count" in data
        assert "years_experience" in data
        assert "credentials" in data
        assert isinstance(data["credentials"], list)
        # Check Spanish content
        assert "Dr." in data["name"]
        print(f"✓ GET surgeon returns: {data['name']}")
    
    def test_save_surgeon_requires_auth(self):
        """Test POST surgeon without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/content/surgeon", json={
            "name": "TEST_Dr. Test",
            "title": "Test Title",
            "bio": "Test bio",
            "image_url": "https://test.com/image.jpg",
            "surgeries_count": "100",
            "years_experience": "5",
            "credentials": ["Test credential"]
        })
        assert response.status_code == 401
        print("✓ POST surgeon without auth returns 401")


class TestHospital:
    """Hospital single-item content tests"""
    
    def test_get_hospital(self):
        """Test GET hospital returns seeded data"""
        response = requests.get(f"{BASE_URL}/api/content/hospital")
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert "id" in data
        assert "name" in data
        assert "description" in data
        assert "image_url" in data
        assert "features" in data
        assert isinstance(data["features"], list)
        assert len(data["features"]) >= 5
        # Check Spanish content
        assert "Estambul" in data["name"] or "Hospital" in data["name"]
        print(f"✓ GET hospital returns: {data['name']}")
    
    def test_save_hospital_requires_auth(self):
        """Test POST hospital without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/content/hospital", json={
            "name": "TEST_Hospital",
            "description": "Test description",
            "image_url": "https://test.com/image.jpg",
            "features": ["Feature 1"]
        })
        assert response.status_code == 401
        print("✓ POST hospital without auth returns 401")


class TestBlog:
    """Blog content tests with SEO fields"""
    
    def test_get_blog_posts(self):
        """Test GET blog returns seeded posts"""
        response = requests.get(f"{BASE_URL}/api/content/blog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Seeded 3 blog posts
        print(f"✓ GET blog returns {len(data)} posts")
    
    def test_blog_post_has_seo_fields(self):
        """Test blog posts have SEO fields"""
        response = requests.get(f"{BASE_URL}/api/content/blog")
        data = response.json()
        if len(data) > 0:
            post = data[0]
            assert "id" in post
            assert "title" in post
            assert "slug" in post
            assert "excerpt" in post
            assert "content" in post
            assert "image_url" in post
            assert "meta_title" in post
            assert "meta_description" in post
            assert "keywords" in post
            assert "published" in post
            assert "created_at" in post
            assert isinstance(post["keywords"], list)
        print("✓ Blog posts have all SEO fields")
    
    def test_get_blog_post_by_slug(self):
        """Test GET blog post by slug"""
        # First get list to find a slug
        list_res = requests.get(f"{BASE_URL}/api/content/blog")
        posts = list_res.json()
        if len(posts) > 0:
            slug = posts[0]["slug"]
            response = requests.get(f"{BASE_URL}/api/content/blog/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert data["slug"] == slug
            assert "content" in data
            print(f"✓ GET blog post by slug '{slug}' works")
    
    def test_get_blog_post_not_found(self):
        """Test GET blog post with invalid slug returns 404"""
        response = requests.get(f"{BASE_URL}/api/content/blog/non-existent-slug-12345")
        assert response.status_code == 404
        print("✓ GET blog post with invalid slug returns 404")
    
    def test_get_published_only_blog_posts(self):
        """Test GET blog with published_only filter"""
        response = requests.get(f"{BASE_URL}/api/content/blog?published_only=true")
        assert response.status_code == 200
        data = response.json()
        # All returned posts should be published
        for post in data:
            assert post["published"] == True
        print(f"✓ GET blog with published_only=true returns only published posts")
    
    def test_create_blog_requires_auth(self):
        """Test POST blog without auth returns 401"""
        response = requests.post(f"{BASE_URL}/api/content/blog", json={
            "title": "TEST_Blog Post",
            "slug": "test-blog-post",
            "excerpt": "Test excerpt",
            "content": "<p>Test content</p>",
            "image_url": "https://test.com/image.jpg",
            "meta_title": "Test Meta Title",
            "meta_description": "Test meta description",
            "keywords": ["test"],
            "published": True
        })
        assert response.status_code == 401
        print("✓ POST blog without auth returns 401")


class TestSitemap:
    """Sitemap XML endpoint tests"""
    
    def test_sitemap_xml(self):
        """Test sitemap.xml returns valid XML"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "application/xml" in response.headers.get("content-type", "")
        content = response.text
        assert '<?xml version="1.0"' in content
        assert '<urlset' in content
        assert 'bariatricistanbul.com' in content
        assert '/blog' in content
        print("✓ Sitemap XML is valid and contains blog URLs")
    
    def test_sitemap_contains_blog_posts(self):
        """Test sitemap includes blog post URLs"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        content = response.text
        # Check for seeded blog slugs
        assert 'manga-gastrica-turquia-guia-completa' in content
        assert 'bypass-gastrico-vs-manga-gastrica' in content
        assert 'precios-cirugia-bariatrica-turquia' in content
        print("✓ Sitemap contains all seeded blog post URLs")


class TestAuthenticatedCRUD:
    """Test CRUD operations with authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_create_and_delete_transformation(self, auth_token):
        """Test create and delete transformation with auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create
        create_res = requests.post(f"{BASE_URL}/api/content/transformations", 
            headers=headers,
            json={
                "weight_lost": "TEST_99kg perdidos",
                "months_post_op": "TEST_24 meses",
                "image_url": "https://test.com/test.jpg",
                "patient_name": "TEST_Patient",
                "procedure_type": "TEST_Manga"
            })
        assert create_res.status_code == 200
        created = create_res.json()
        assert created["weight_lost"] == "TEST_99kg perdidos"
        item_id = created["id"]
        print(f"✓ Created transformation with id: {item_id}")
        
        # Delete
        delete_res = requests.delete(f"{BASE_URL}/api/content/transformations/{item_id}", headers=headers)
        assert delete_res.status_code == 200
        print(f"✓ Deleted transformation {item_id}")
    
    def test_create_and_delete_testimonial(self, auth_token):
        """Test create and delete testimonial with auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create
        create_res = requests.post(f"{BASE_URL}/api/content/testimonials", 
            headers=headers,
            json={
                "name": "TEST_User",
                "country": "TEST_Country",
                "text": "TEST_This is a test testimonial",
                "rating": 5
            })
        assert create_res.status_code == 200
        created = create_res.json()
        item_id = created["id"]
        print(f"✓ Created testimonial with id: {item_id}")
        
        # Delete
        delete_res = requests.delete(f"{BASE_URL}/api/content/testimonials/{item_id}", headers=headers)
        assert delete_res.status_code == 200
        print(f"✓ Deleted testimonial {item_id}")
    
    def test_create_and_delete_blog_post(self, auth_token):
        """Test create and delete blog post with auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create
        create_res = requests.post(f"{BASE_URL}/api/content/blog", 
            headers=headers,
            json={
                "title": "TEST_Blog Post Title",
                "slug": "test-blog-post-slug-12345",
                "excerpt": "TEST_This is a test excerpt",
                "content": "<p>TEST_This is test content</p>",
                "image_url": "https://test.com/test.jpg",
                "meta_title": "TEST_Meta Title",
                "meta_description": "TEST_Meta description",
                "keywords": ["test", "blog"],
                "published": False
            })
        assert create_res.status_code == 200
        created = create_res.json()
        assert created["title"] == "TEST_Blog Post Title"
        assert created["slug"] == "test-blog-post-slug-12345"
        item_id = created["id"]
        print(f"✓ Created blog post with id: {item_id}")
        
        # Verify by GET
        get_res = requests.get(f"{BASE_URL}/api/content/blog/test-blog-post-slug-12345")
        assert get_res.status_code == 200
        print("✓ Blog post retrievable by slug")
        
        # Delete
        delete_res = requests.delete(f"{BASE_URL}/api/content/blog/{item_id}", headers=headers)
        assert delete_res.status_code == 200
        print(f"✓ Deleted blog post {item_id}")
        
        # Verify deleted
        get_res2 = requests.get(f"{BASE_URL}/api/content/blog/test-blog-post-slug-12345")
        assert get_res2.status_code == 404
        print("✓ Blog post no longer exists after delete")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
