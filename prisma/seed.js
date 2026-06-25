const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial data...');

    // 1. Create Institution
    const demoInst = await prisma.institution.upsert({
        where: { subdomain: 'demo' },
        update: {},
        create: {
            name: 'Demo University',
            subdomain: 'demo'
        }
    });

    // 2. Create Default Categories
    const categories = ['Electrical', 'Plumbing', 'Carpentry', 'IT'];
    for (const catName of categories) {
        const exists = await prisma.category.findFirst({
            where: { name: catName, institutionId: demoInst.id }
        });
        if (!exists) {
            await prisma.category.create({
                data: { name: catName, institutionId: demoInst.id }
            });
        }
    }

    // 3. Create Default Buildings
    const buildings = ['Block A', 'Block B', 'Library', 'Main Admin'];
    for (const bldName of buildings) {
        const exists = await prisma.building.findFirst({
            where: { name: bldName, institutionId: demoInst.id }
        });
        if (!exists) {
            await prisma.building.create({
                data: { name: bldName, institutionId: demoInst.id, type: 'Hostel' }
            });
        }
    }

    // 4. Create Demo User
    const demoEmail = 'john@demo.edu';
    const pwdHash = await bcrypt.hash('password123', 10);
    const student = await prisma.user.upsert({
        where: { email: demoEmail },
        update: { passwordHash: pwdHash }, // Ensure correct password hash
        create: {
            email: demoEmail,
            name: 'John Doe',
            passwordHash: pwdHash,
            institutionId: demoInst.id,
            role: 'STUDENT'
        }
    });

    // 5. Create Sample Announcements
    const ancExists = await prisma.announcement.findFirst({
        where: { institutionId: demoInst.id }
    });

    if (!ancExists) {
        await prisma.announcement.createMany({
            data: [
                {
                    institutionId: demoInst.id,
                    title: 'Welcome to CampusFlow',
                    content: 'We are thrilled to launch the new maintenance management system. Submit your complaints online!',
                    type: 'Notice'
                },
                {
                    institutionId: demoInst.id,
                    title: 'Water Supply Disruption',
                    content: 'Water supply in Block A will be cut off tomorrow from 2PM to 4PM for routine maintenance.',
                    type: 'Alert'
                },
                {
                    institutionId: demoInst.id,
                    title: 'Annual Tech Festival',
                    content: 'Get ready for the biggest tech festival this weekend at the Main Admin building!',
                    type: 'Event'
                }
            ]
        });
    }

    // 6. Create Default Service Queues
    const queuesExist = await prisma.serviceQueue.count();
    if (queuesExist === 0) {
        await prisma.serviceQueue.createMany({
            data: [
                { institutionId: demoInst.id, name: 'Financial Aid Office', isOpen: true },
                { institutionId: demoInst.id, name: 'IT Helpdesk', isOpen: true },
                { institutionId: demoInst.id, name: 'Registrar', isOpen: true }
            ]
        });
    }

    // 7. Create Default Marketplace Items
    const itemsExist = await prisma.marketItem.count();
    if (itemsExist === 0) {
        await prisma.marketItem.createMany({
            data: [
                {
                    institutionId: demoInst.id,
                    studentId: jane.id, // Assigned to Jane so John can buy it!
                    title: "Calculus Early Transcendentals 9th Ed",
                    description: "Barely used, no highlighting. Essential for Math 101.",
                    price: 45.00,
                    condition: "Good",
                    contactInfo: "Email me at jane@demo.edu",
                    status: "AVAILABLE"
                },
                {
                    institutionId: demoInst.id,
                    studentId: jane.id,
                    title: "Mini Fridge with Freezer",
                    description: "Works perfectly. Moving out so I need to sell it ASAP.",
                    price: 60.00,
                    condition: "Used",
                    contactInfo: "Text 555-0199",
                    status: "AVAILABLE"
                }
            ]
        });
    }

    // 8. Create Default Attendance Course and Session (Phase 8)
    const coursesExist = await prisma.course.count();
    if (coursesExist === 0) {
        const course = await prisma.course.create({
            data: {
                institutionId: demoInst.id,
                code: 'CS101',
                name: 'Introduction to Computer Science'
            }
        });

        // Create an active session with a dummy geofence (e.g. random coordinates)
        // Let's use 0,0 so the student is guaranteed to be out of bounds unless we bypass or mock it.
        // Actually, let's use a wide radius (e.g. 10000000 meters) or just leave it null if no geofence.
        // For the demo, let's put it somewhere near typical defaults (like 37.7749, -122.4194 for SF)
        await prisma.attendanceSession.create({
            data: {
                courseId: course.id,
                checkInCode: 'DEMO5',
                isActive: true,
                latitude: 37.7749,
                longitude: -122.4194,
                radiusMeters: 50.0
            }
        });
    }

    console.log('Seeding complete! You can log in with john@demo.edu / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
