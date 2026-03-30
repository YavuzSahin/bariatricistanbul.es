#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Bariatric Istanbul CMS
Tests all authentication and content management endpoints
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class BariatricIstanbulAPITester:
    def __init__(self, base_url: str = "https://health-intake-22.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_credentials = {
            "email": "admin@bariatricistanbul.com",
            "password": "admin123"
        }
        
    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, auth_required: bool = False) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
                
            if not success:
                response_data["status_code"] = response.status_code
                response_data["expected_status"] = expected_status
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self) -> bool:
        """Test admin authentication"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test login
        success, response = self.make_request(
            "POST", "auth/login", 
            self.admin_credentials, 
            expected_status=200
        )
        
        if success and "email" in response:
            return self.log_test("Admin Login", True, f"- User: {response.get('email')}")
        else:
            return self.log_test("Admin Login", False, f"- Response: {response}")

    def test_auth_endpoints(self) -> bool:
        """Test all authentication endpoints"""
        print("\n🔑 Testing Authentication Endpoints...")
        
        # Test /me endpoint (should work after login)
        success, response = self.make_request("GET", "auth/me", expected_status=200)
        me_test = self.log_test("Get Current User (/auth/me)", success, 
                               f"- User: {response.get('email', 'N/A')}")
        
        # Test logout
        success, response = self.make_request("POST", "auth/logout", expected_status=200)
        logout_test = self.log_test("Admin Logout", success)
        
        return me_test and logout_test

    def test_content_endpoints(self) -> bool:
        """Test all content CRUD operations"""
        print("\n📝 Testing Content Management Endpoints...")
        
        # Re-login for content tests
        self.make_request("POST", "auth/login", self.admin_credentials)
        
        content_types = [
            ("transformations", {
                "weight_lost": "Test 50kg lost",
                "months_post_op": "6 months post-op",
                "image_url": "https://example.com/test.jpg"
            }),
            ("testimonials", {
                "name": "Test User",
                "country": "Test Country",
                "text": "This is a test testimonial",
                "rating": 5
            }),
            ("video-testimonials", {
                "title": "Test Video",
                "duration": "2:30",
                "thumbnail_url": "https://example.com/thumb.jpg",
                "video_url": "https://example.com/video.mp4"
            }),
            ("itinerary", {
                "day_number": 99,
                "title": "Test Day",
                "description": "This is a test itinerary day"
            })
        ]
        
        all_passed = True
        created_items = {}
        
        for content_type, test_data in content_types:
            print(f"\n  Testing {content_type}...")
            
            # Test GET (list)
            success, response = self.make_request("GET", f"content/{content_type}")
            get_test = self.log_test(f"GET {content_type}", success, 
                                   f"- Found {len(response) if isinstance(response, list) else 0} items")
            
            # Test POST (create)
            success, response = self.make_request("POST", f"content/{content_type}", 
                                                 test_data, expected_status=200)
            if success and "id" in response:
                created_items[content_type] = response["id"]
                create_test = self.log_test(f"CREATE {content_type}", True, f"- ID: {response['id']}")
            else:
                create_test = self.log_test(f"CREATE {content_type}", False, f"- Response: {response}")
            
            # Test PUT (update) if item was created
            if content_type in created_items:
                update_data = test_data.copy()
                if "title" in update_data:
                    update_data["title"] = "Updated " + update_data["title"]
                elif "name" in update_data:
                    update_data["name"] = "Updated " + update_data["name"]
                elif "weight_lost" in update_data:
                    update_data["weight_lost"] = "Updated " + update_data["weight_lost"]
                
                success, response = self.make_request("PUT", f"content/{content_type}/{created_items[content_type]}", 
                                                     update_data, expected_status=200)
                update_test = self.log_test(f"UPDATE {content_type}", success)
            else:
                update_test = False
            
            # Test DELETE if item was created
            if content_type in created_items:
                success, response = self.make_request("DELETE", f"content/{content_type}/{created_items[content_type]}", 
                                                     expected_status=200)
                delete_test = self.log_test(f"DELETE {content_type}", success)
            else:
                delete_test = False
            
            all_passed = all_passed and get_test and create_test and update_test and delete_test
        
        return all_passed

    def test_api_root(self) -> bool:
        """Test API root endpoint"""
        print("\n🏠 Testing API Root...")
        success, response = self.make_request("GET", "", expected_status=200)
        return self.log_test("API Root", success, f"- Message: {response.get('message', 'N/A')}")

    def run_all_tests(self) -> bool:
        """Run comprehensive test suite"""
        print("🚀 Starting Bariatric Istanbul API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("API Root", self.test_api_root),
            ("Admin Authentication", self.test_admin_login),
            ("Auth Endpoints", self.test_auth_endpoints),
            ("Content Management", self.test_content_endpoints),
        ]
        
        all_passed = True
        for test_name, test_func in tests:
            try:
                result = test_func()
                all_passed = all_passed and result
            except Exception as e:
                print(f"❌ {test_name} - ERROR: {str(e)}")
                all_passed = False
        
        # Final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if all_passed:
            print("🎉 All tests PASSED! Backend API is working correctly.")
        else:
            print("⚠️  Some tests FAILED. Check the details above.")
            
        return all_passed

def main():
    """Main test execution"""
    tester = BariatricIstanbulAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())