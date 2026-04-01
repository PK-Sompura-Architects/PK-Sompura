from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend.models import Temple, TempleImage, Base

# Re-create tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed_data():
    db: Session = SessionLocal()

    # 1. Vaishno Devi (Milestone)
    vaishno = Temple(
        name_en="Shree Mata Vaishnodevi Shrine",
        name_gu="શ્રી માતા વૈષ્ણોદેવી તીર્થ",
        name_hi="श्री माता वैष्णोदेवी तीर्थ",
        
        description_en="A sacred destination atop the Trikuta Mountains...",
        description_gu="જમ્મુના ત્રિકુટા પર્વતો પરનું આ પવિત્ર સ્થાન...",
        description_hi="जम्मू के त्रिकुटा पर्वतों पर स्थित यह पवित्र स्थान...",
        
        city="Katra",
        state="Jammu & Kashmir",
        location="Trikuta Mountains",
        year="1999",
        
        is_milestone=True,
        is_featured=True,
        order_index=1
    )
    db.add(vaishno)
    db.commit() # commit to get ID
    
    # Images for Vaishno
    # Note: These images might not exist yet, user needs to upload them via Admin
    # But we seed the records so they show up (with broken images initially, or placeholders if we had them)
    # We will use placeholders or assume user will fix via Admin.
    
    # 2. Akshardham (Gandhinagar)
    akshardham = Temple(
        name_en="Akshardham Temple",
        name_gu="અક્ષરધામ મંદિર",
        name_hi="अक्षरधाम मंदिर",
        
        description_en="A masterpiece of pink sandstone...",
        description_gu="ગુલાબી પથ્થરની અદભૂત કૃતિ...",
        description_hi="गुलाबी बलुआ पत्थर की एक उत्कृष्ट कृति...",
        
        city="Gandhinagar",
        state="Gujarat",
        location="Sector 20",
        year="1992",
        
        is_milestone=False,
        is_featured=True,
        order_index=2
    )
    db.add(akshardham)
    
    # 3. Somnath (Restoration)
    somnath = Temple(
        name_en="Somnath Temple",
        name_gu="સોમનાથ મંદિર",
        name_hi="सोमनाथ मंदिर",
        
        description_en="The eternal shrine, rebuilt...",
        description_gu="શાશ્વત તીર્થ, પુનઃનિર્મિત...",
        description_hi="शाश्वत तीर्थ, पुनर्निर्मित...",
        
        city="Prabhas Patan",
        state="Gujarat",
        location="Veraval",
        year="1951",
        
        is_milestone=False,
        is_featured=True,
        order_index=3
    )
    db.add(somnath)
    
    # 4. Ambaji
    ambaji = Temple(
        name_en="Ambaji Temple",
        name_gu="અંબાજી મંદિર",
        name_hi="अम्बाजी मंदिर",
        
        description_en="One of the 51 Shakti Peethas...",
        description_gu="51 શક્તિપીઠોમાંની એક...",
        description_hi="51 शक्तिपीठों में से एक...",
        
        city="Ambaji",
        state="Gujarat",
        location="Banaskantha",
        year="1975",
        
        is_milestone=False,
        is_featured=True,
        order_index=4
    )
    db.add(ambaji)

    db.commit()
    print("Seeding complete.")
    db.close()

if __name__ == "__main__":
    seed_data()
