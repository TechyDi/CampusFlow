#!/bin/bash
git pull origin main
npm install
npx prisma generate
npx prisma db push
pm2 restart campusflow
