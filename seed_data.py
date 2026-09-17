import os
from backend.database import SessionLocal, engine
from backend.models import Base, LineageMember, TempleProject, GalleryImage

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing
db.query(GalleryImage).delete()
db.query(TempleProject).delete()
db.query(LineageMember).delete()
db.commit()

# 1. Seed Lineage
lineage_data = [
    LineageMember(name="Prabhashankar Oghadbhai Sompura", role="Founder & Master Architect", image_url="https://images.unsplash.com/photo-1516822264585-ea0eb9f160e1?q=80&w=600&auto=format&fit=crop", rank=1),
    LineageMember(name="Amrutlal Prabhashankar Sompura", role="Principal Architect", image_url="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=600&auto=format&fit=crop", rank=2),
    LineageMember(name="Kirit Amrutlal Sompura", role="Senior Temple Designer", image_url="https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=600&auto=format&fit=crop", rank=3),
    LineageMember(name="Ashish Kirit Sompura", role="Lead Sculptor & Designer", image_url="https://images.unsplash.com/photo-1631269094709-bba07843d7ce?q=80&w=600&auto=format&fit=crop", rank=4),
    LineageMember(name="Yagnik Ashish Sompura", role="Next-Gen Architect", image_url="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=600&auto=format&fit=crop", rank=5)
]
db.add_all(lineage_data)
db.commit()

# 2. Seed Temples
temples_data = [
    TempleProject(name="Moonlight Ganesha Temple", trust_name="Moonlight Trust", status="Milestone", city="Jaipur", main_image="https://images.unsplash.com/photo-1516822264585-ea0eb9f160e1?q=80&w=1000&auto=format&fit=crop"),
    TempleProject(name="Speedway Shiva Shrine", trust_name="Speedway Foundation", status="Featured", city="Mumbai", main_image="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop"),
    TempleProject(name="Crimson Concept Mandir", trust_name="Crimson Trust", status="Featured", city="Ahmedabad", main_image="https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1000&auto=format&fit=crop"),
    TempleProject(name="Obsidian Krishna Sanctuary", trust_name="Obsidian Trust", status="Completed", city="Delhi", main_image="https://images.unsplash.com/photo-1631269094709-bba07843d7ce?q=80&w=1000&auto=format&fit=crop"),
    TempleProject(name="Twin Peaks Vishnu Vihar", trust_name="Twin Peaks Trust", status="Featured", city="Pune", main_image="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1000&auto=format&fit=crop")
]
db.add_all(temples_data)
db.commit()

print("Local Database Seeded!")
