import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait  # Import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from dotenv import load_dotenv
from selenium.webdriver import ChromeService
from seleniumwire import webdriver

load_dotenv()

def login(driver):
    email = os.getenv("EMAIL")
    password = os.getenv("PASSWORD")

    driver.find_element(By.ID, "username").send_keys(email)
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.ID, "register-button").click()
    
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "button[type='submit']"))
        )
    except Exception as e:
        print(f"Error timeout exception: {e}")
        driver.quit()
        return False


def main():
    project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    chromedriver_path = os.path.join(project_dir, "utils", "chromedriver")

    url = "https://info-car.pl/oauth2/login"
    options = webdriver.ChromeOptions()
    options.add_argument('--silent')
    options.add_argument('--headless')
    options.add_argument('--log-level=3')
    options.page_load_strategy = 'normal'

    service = ChromeService(executable_path=chromedriver_path)
    driver = webdriver.Chrome(service=service, options=options)

    try:
        driver.get(url)
        if login(driver) == False:
            return
        
        searchUrl = "https://info-car.pl/oauth2/userinfo"
        for request in driver.requests:
            if request.url == searchUrl:
                print(request.headers['Authorization'])
                break
    except Exception as e:
        print(f"Error in main: {e}")
    finally:
        driver.quit()

main()