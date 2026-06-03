import os
import sys
import importlib
import unittest
from unittest.mock import patch

# Add project root directory to path to resolve backend package correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestConfig(unittest.TestCase):
    @patch.dict(os.environ, {
        "SECRET_KEY": "testsecretoverride",
        "ALGORITHM": "HS512",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "120"
    })
    def test_config_env_override(self):
        # Reload backend.app.config module to load new env variables
        import backend.app.config as config
        importlib.reload(config)
        
        self.assertEqual(config.SECRET_KEY, "testsecretoverride")
        self.assertEqual(config.ALGORITHM, "HS512")
        self.assertEqual(config.ACCESS_TOKEN_EXPIRE_MINUTES, 120)
        
    def tearDown(self):
        # Restore defaults by reloading config without env variables
        import backend.app.config as config
        importlib.reload(config)

if __name__ == "__main__":
    unittest.main()
