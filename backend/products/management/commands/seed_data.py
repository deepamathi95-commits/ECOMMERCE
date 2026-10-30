"""Seed sample categories and products that use the bundled images in frontend/public/images.
Run: python manage.py seed_data   (safe to re-run; use --reset to rebuild the catalog)
All names, prices, ratings and descriptions are sample data for demonstration."""
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from products.models import Category, Product, ProductImage

P = "/images/products/"
B = "/images/banners/"

CATEGORIES = [
    ("Sneakers", "Running, training and everyday sneakers built for comfort.", B + "hero-sneakers.jpg"),
    ("Casual Shoes", "Easy, everyday pairs for work, weekends and play.", B + "loafers.jpg"),
    ("Formal Shoes", "Polished loafers and derbies for the office and occasions.", B + "men.png"),
    ("Boots", "Sturdy boots and rain boots for every season.", B + "sneaker-pattern.jpg"),
    ("Sandals & Slides", "Breathable sandals, slides and wedges for warm days.", B + "women.png"),
    ("Heels & Flats", "Statement heels and elegant flats.", B + "blue-heels.jpg"),
]

SPECS = {
    "sneakers": {"Upper": "Breathable mesh", "Sole": "Cushioned rubber", "Closure": "Lace-up", "Care": "Wipe clean with a damp cloth"},
    "casual-shoes": {"Upper": "Soft synthetic", "Sole": "Flexible rubber", "Fit": "True to size", "Care": "Wipe clean with a damp cloth"},
    "formal-shoes": {"Upper": "Polished finish", "Sole": "Durable rubber", "Fit": "True to size", "Care": "Polish and wipe clean"},
    "boots": {"Upper": "Weather-ready finish", "Sole": "Grip rubber", "Fit": "True to size", "Care": "Wipe clean; air dry"},
    "sandals-slides": {"Upper": "Lightweight straps", "Sole": "Cushioned footbed", "Fit": "True to size", "Care": "Wipe clean with a damp cloth"},
    "heels-flats": {"Upper": "Smooth finish", "Sole": "Non-slip outsole", "Fit": "True to size", "Care": "Wipe clean with a soft cloth"},
}

HEX = {
    "Tan": "#B07A45", "Navy": "#1F2A44", "White": "#FFFFFF", "Brown": "#6B4A32", "Black": "#1A1A1A", "Blue": "#2F6F9F",
    "Maroon": "#5C1F26", "Cognac": "#B5651D", "Pearl": "#E8C9D6", "Blush": "#E8BFB8", "Silver": "#C0C0C8", "Grey": "#9A9A9A",
    "Cream": "#EADBC0", "Lilac": "#B9A0E0", "Denim": "#7C9CC4", "Pink": "#F4A6C0", "Red": "#C0392B", "Pastel": "#CBB8E8",
    "Marble": "#C9B3E8", "Multi": "#9B7EDE", "Green": "#3E8E5A", "Gold": "#C9A24B", "Olive": "#6B6B3A",
}

MEN, WOMEN, KIDS, UNI = "men", "women", "kids", "unisex"
S_MEN, S_WOMEN, S_KIDS = "6,7,8,9,10,11", "3,4,5,6,7,8", "10,11,12,13,1,2,3"


def img(name, alt, color=""):
    return (P + name, alt, color)


# (name, category-slug, audience, price, discount, sizes, colors, stock, featured, best_seller, rating, reviews, days_old, blurb, images)
PRODUCTS = [
    ("Harbor Leather Boat Shoe", "casual-shoes", MEN, "89.00", "74.00", S_MEN, ["Tan"], 40, True, True, "4.7", 128, 40,
     "A relaxed deck-style shoe with contrast stitching and a cushioned, flexible sole.",
     [img("boat-shoe.png", "Tan boat shoe, side view"), img("boat-shoe-front.png", "Tan boat shoe, front"), img("boat-shoe-back.png", "Tan boat shoe, heel"),
      img("boat-shoe-pair.png", "Pair of tan boat shoes"), img("boat-shoe-detail.png", "Boat shoe lacing detail"), img("boat-shoe-lifestyle.png", "Boat shoes on a dock")]),
    ("Stride Pro Running Shoe", "sneakers", MEN, "79.00", "64.00", S_MEN, ["Navy", "White"], 55, True, True, "4.6", 214, 10,
     "A lightweight trainer with a breathable mesh upper and a springy, cushioned midsole.",
     [img("runner-navy.png", "Navy running shoe", "Navy"), img("runner-navy-2.jpg", "Navy running shoe, studio", "Navy"), img("runner-white.jpg", "White running shoe", "White")]),
    ("Trailmate Leather Sandal", "sandals-slides", MEN, "59.00", None, S_MEN, ["Tan"], 30, False, False, "4.3", 61, 70,
     "Adjustable hook-and-loop straps and a contoured footbed for all-day wear.", [img("tan-sandal.png", "Tan leather sandal")]),
    ("Cross-Strap Comfort Slipper", "sandals-slides", MEN, "39.00", None, S_MEN, ["White"], 45, False, False, "4.1", 33, 90,
     "A slip-on toe-loop sandal with crossover straps and a soft black sole.", [img("white-slipper.png", "White cross-strap slipper")]),
    ("Ridge Lace-Up Boot", "boots", MEN, "99.00", "84.00", S_MEN, ["Brown"], 25, True, False, "4.5", 97, 30,
     "A rugged lace-up boot with a padded collar and a chunky lugged sole.", [img("brown-boot.png", "Brown lace-up boot")]),
    ("Summit Fleece-Lined Boot", "boots", MEN, "109.00", None, S_MEN, ["Black"], 18, False, True, "4.8", 156, 120,
     "A warm, fleece-lined winter boot with strong grip for cold, wet days.", [img("black-winter-boot.png", "Black fleece-lined boot")]),
    ("Urban Brown Casual Sneaker", "casual-shoes", MEN, "69.00", None, S_MEN, ["Brown"], 35, False, False, "4.2", 48, 55,
     "A smart-casual lace-up with a soft leather-look upper and a cushioned sole.", [img("brown-casual.png", "Brown casual shoe")]),
    ("Aero Knit Sneaker", "sneakers", MEN, "74.00", "59.00", S_MEN, ["Blue"], 50, True, False, "4.6", 72, 5,
     "A sock-like knit sneaker that flexes with your stride and keeps feet cool.", [img("blue-knit-sneaker.png", "Blue knit sneaker")]),
    ("Kolhapuri Gloss Sandal", "sandals-slides", MEN, "64.00", None, S_MEN, ["Maroon"], 22, False, False, "4.4", 39, 80,
     "Glossy cross-strap sandal with a traditional silhouette and a low heel.", [img("maroon-glossy-sandal.png", "Maroon glossy sandal")]),
    ("Peshawari Heritage Sandal", "sandals-slides", MEN, "79.00", None, S_MEN, ["Brown"], 20, False, False, "4.5", 44, 65,
     "A buckled back-strap sandal with a patterned cross panel and a stacked heel.", [img("peshawari-sandal.png", "Brown patterned heritage sandal")]),
    ("Monaco Black Loafer", "formal-shoes", MEN, "94.00", None, S_MEN, ["Black"], 28, False, True, "4.6", 109, 100,
     "A refined black loafer with a metal bit detail and a flexible driving sole.", [img("black-loafer.png", "Black bit loafer")]),
    ("Cognac Tassel Loafer", "formal-shoes", MEN, "119.00", "99.00", S_MEN, ["Cognac"], 16, True, False, "4.8", 85, 20,
     "A tassel loafer in warm cognac with a stacked heel, made to dress up any outfit.", [img("tan-tassel-loafer.png", "Cognac tassel loafer")]),
    ("Gloss Platform Derby", "formal-shoes", WOMEN, "84.00", None, S_WOMEN, ["Black"], 24, False, False, "4.4", 58, 45,
     "A glossy patent derby on a chunky platform sole for a bold, polished look.", [img("black-patent-derby.png", "Black patent platform derby")]),
    ("Pearl Bloom Sandal", "sandals-slides", WOMEN, "54.00", None, S_WOMEN, ["Pearl"], 30, False, False, "4.3", 41, 75,
     "A dainty T-strap sandal with pearl detailing and a cushioned wedge footbed.", [img("pearl-sandal.png", "Pearl embellished sandal")]),
    ("Sparkle Slip-On Sneaker", "sneakers", WOMEN, "69.00", "55.00", S_WOMEN, ["White", "Blush", "Navy"], 60, True, True, "4.7", 301, 15,
     "A laceless knit slip-on with sparkling studs and a light, flexible sole.",
     [img("white-studded-slipon.png", "White studded slip-on", "White"), img("blush-studded-slipon.jpg", "Blush studded slip-on", "Blush"), img("navy-studded-slipon.jpg", "Navy studded slip-on", "Navy")]),
    ("Coastal Wedge Sandal", "sandals-slides", WOMEN, "64.00", None, S_WOMEN, ["Navy"], 26, False, False, "4.5", 52, 85,
     "An elastic-strap wedge sandal with a cork-look sole for easy summer comfort.", [img("navy-wedge.png", "Navy wedge sandal")]),
    ("Bloom Bow Slide", "sandals-slides", WOMEN, "29.00", None, S_WOMEN, ["Blue"], 50, False, False, "4.0", 27, 110,
     "A soft floral slide with a knotted bow and a cushioned flat sole.", [img("floral-bow-slide.png", "Floral bow slide")]),
    ("Crystal Strap Slide", "sandals-slides", WOMEN, "44.00", None, S_WOMEN, ["Gold"], 32, False, False, "4.2", 36, 60,
     "A clear-strap slide with crystal accents and a warm tan footbed.", [img("crystal-slide.png", "Crystal strap slide")]),
    ("Bow Ballet Flat", "heels-flats", WOMEN, "49.00", None, S_WOMEN, ["Brown", "Cream"], 38, False, False, "4.4", 66, 50,
     "A breathable woven ballet flat finished with a satin bow.", [img("bow-ballet-flat.png", "Woven ballet flats with bows")]),
    ("Silver Block Heel Sandal", "heels-flats", WOMEN, "89.00", "72.00", S_WOMEN, ["Silver"], 20, True, True, "4.7", 118, 25,
     "A glittering ankle-strap sandal on a stable metallic block heel.",
     [img("silver-block-heel.png", "Silver block heel sandal"), img("silver-block-heel-2.jpg", "Silver block heel sandal, studio")]),
    ("Silver Crest Block Mule", "heels-flats", WOMEN, "79.00", None, S_WOMEN, ["Silver"], 18, False, False, "4.3", 29, 35,
     "An open-toe mule with a crystal-crested strap and a mid block heel.", [img("silver-block-mule.jpg", "Silver block heel mule")]),
    ("Noir Stiletto Mule", "heels-flats", WOMEN, "74.00", None, S_WOMEN, ["Black"], 15, False, True, "4.6", 94, 95,
     "A pointed patent mule on a slim stiletto heel for evenings out.", [img("black-mule-heel.png", "Black patent stiletto mule")]),
    ("Champagne Kitten Mule", "heels-flats", WOMEN, "79.00", "65.00", S_WOMEN, ["Cream"], 17, True, False, "4.5", 31, 3,
     "A pointed kitten-heel mule with a jewelled buckle detail.", [img("cream-kitten-heel.png", "Cream kitten heel mule")]),
    ("Velcro Wedge Sandal", "sandals-slides", WOMEN, "59.00", None, S_WOMEN, ["Grey"], 27, False, False, "4.2", 38, 105,
     "A supportive wedge with an adjustable hook-and-loop strap.", [img("grey-wedge.png", "Grey wedge sandal")]),
    ("Onyx Thong Sandal", "sandals-slides", WOMEN, "34.00", None, S_WOMEN, ["Black"], 40, False, False, "4.1", 45, 130,
     "A slim thong sandal with a metallic accent and a flat tan sole.", [img("black-thong-sandal.png", "Black thong sandal")]),
    ("Lilac Swirl Clog", "casual-shoes", KIDS, "29.00", None, S_KIDS, ["Lilac"], 35, False, False, "4.5", 83, 40,
     "A lightweight swirl-print clog with a pivoting heel strap.", [img("kids-purple-clog.png", "Lilac swirl clog")]),
    ("Denim Hearts Mary Jane", "casual-shoes", KIDS, "34.00", None, S_KIDS, ["Denim"], 28, False, False, "4.4", 37, 60,
     "A heart-print canvas Mary Jane with a hook-and-loop strap and bow.", [img("kids-denim-maryjane.png", "Denim hearts Mary Jane")]),
    ("Petal Pink Sneaker", "sneakers", KIDS, "39.00", None, S_KIDS, ["Pink"], 33, False, True, "4.6", 120, 30,
     "A sparkly flower-print sneaker with an easy hook-and-loop strap.", [img("kids-pink-sneaker.png", "Pink flower sneaker")]),
    ("Pastel Flower Sandal", "sandals-slides", KIDS, "36.00", None, S_KIDS, ["Pastel"], 29, False, False, "4.3", 26, 70,
     "A pastel strappy sandal with a flower accent and a cushioned sole.", [img("kids-pastel-sandal.png", "Pastel flower sandal")]),
    ("Hero Print Sneaker", "sneakers", KIDS, "44.00", "36.00", S_KIDS, ["Red"], 36, True, True, "4.7", 175, 12,
     "A bold, high-energy sneaker with a quick-fasten strap and a springy sole.", [img("kids-hero-sneaker.png", "Red and navy hero print sneaker")]),
    ("Cozy Strap Slipper", "casual-shoes", KIDS, "24.00", None, S_KIDS, ["Blue"], 40, False, False, "4.2", 51, 85,
     "A soft indoor slipper with a grippy sole and a hook-and-loop strap.", [img("kids-blue-slipper.png", "Blue striped kids slipper")]),
    ("Sparkle Doll Slipper", "casual-shoes", KIDS, "24.00", None, S_KIDS, ["Pink"], 31, False, False, "4.3", 42, 88,
     "A glittery strap slipper with a bold print, made for playtime at home.", [img("kids-pink-slipper.png", "Pink sparkle print slippers")]),
    ("Fluffy Pom Boot", "boots", KIDS, "32.00", None, S_KIDS, ["Pink"], 24, False, False, "4.6", 63, 115,
     "A plush, warm boot slipper with pom-pom ties for chilly mornings.", [img("kids-fluffy-boot.png", "Pink fluffy pom-pom boot")]),
    ("Marble Charm Clog", "casual-shoes", KIDS, "31.00", None, S_KIDS, ["Marble"], 34, False, False, "4.5", 78, 20,
     "A marbled clog with swappable charms and a secure heel strap.", [img("kids-marble-clog.png", "Marbled clogs with charms")]),
    ("Light-Up Frost Sandal", "sandals-slides", KIDS, "38.00", None, S_KIDS, ["Multi"], 21, False, False, "4.4", 49, 45,
     "A purple print sandal with light-up soles and double hook-and-loop straps.", [img("kids-light-sandal.png", "Purple light-up kids sandal")]),
    ("Classic Wellington Boot", "boots", UNI, "34.00", None, S_MEN, ["Black"], 42, False, False, "4.3", 90, 150,
     "A waterproof wellington with a deep-tread sole for puddles and muddy paths.", [img("black-wellington.png", "Black wellington boot")]),
    ("Rainbow Unicorn Rain Boot", "boots", KIDS, "29.00", None, S_KIDS, ["Blue"], 26, False, False, "4.7", 102, 18,
     "A glittery waterproof boot with a bright sole and an easy pull-on fit.", [img("kids-rain-boot.png", "Navy unicorn rain boot")]),
    ("Dino Trail Sneaker", "sneakers", KIDS, "39.00", None, S_KIDS, ["Blue"], 30, False, False, "4.6", 58, 4,
     "A dino-print canvas sneaker with a toe bumper and a quick strap.", [img("kids-dino-sneaker.jpg", "Blue dino print sneaker")]),
    ("Daisy Strap Sandal", "sandals-slides", KIDS, "33.00", None, S_KIDS, ["Pink"], 27, False, False, "4.4", 35, 55,
     "A soft pink sandal with daisy accents and a flexible rubber sole.", [img("kids-daisy-sandal.jpg", "Pink daisy kids sandal")]),
]


class Command(BaseCommand):
    help = "Create sample categories and products using the bundled images."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing products/categories first.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            Product.objects.all().delete()
            Category.objects.all().delete()
        cats = {}
        for name, desc, image_path in CATEGORIES:
            cat, _ = Category.objects.update_or_create(name=name, defaults={"description": desc, "image_path": image_path})
            cats[cat.slug] = cat

        now = timezone.now()
        created = 0
        for (name, cslug, aud, price, disc, sizes, colors, stock, feat, best, rating, reviews, days, blurb, images) in PRODUCTS:
            defaults = dict(
                description=blurb, price=Decimal(price), discount_price=Decimal(disc) if disc else None, category=cats[cslug],
                audience=aud, sizes=sizes, colors=",".join(f"{c}:{HEX[c]}" for c in colors),
                specifications=SPECS[cslug], stock_quantity=stock, is_featured=feat, is_best_seller=best,
                rating=Decimal(rating), review_count=reviews, is_active=True,
            )
            product, was_created = Product.objects.update_or_create(name=name, defaults=defaults)
            Product.objects.filter(pk=product.pk).update(created_at=now - timedelta(days=days))
            product.images.all().delete()
            for pos, (file_path, alt, color) in enumerate(images):
                ProductImage.objects.create(product=product, path=file_path, alt=alt, color=color, position=pos)
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(cats)} categories and {len(PRODUCTS)} products ({created} new)."))
