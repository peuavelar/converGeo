from locust import HttpUser, task, between


class EngineUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(3)
    def health(self):
        self.client.get("/health")

    @task(5)
    def score(self):
        self.client.get("/score", params={"lat": -12.9714, "lng": -38.5014, "segmento": "food_service"})

    @task(2)
    def top(self):
        self.client.get("/top", params={"segmento": "food_service", "limit": 5})
