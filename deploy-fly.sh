#!/bin/bash

# ProductFormulator Fly.io Deployment Script

echo "🚀 Deploying ProductFormulator to Fly.io..."

# 1. Install Fly CLI if not present
if ! command -v flyctl &> /dev/null; then
    echo "Installing Fly CLI..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# 2. Login to Fly.io (if not already logged in)
echo "Checking Fly.io authentication..."
flyctl auth whoami || flyctl auth login

# 3. Create Fly.io app (if it doesn't exist)
echo "Creating Fly.io app..."
flyctl apps create productformulator --org personal || echo "App may already exist"

# 4. Set up PostgreSQL database
echo "Setting up PostgreSQL database..."
flyctl postgres create --name productformulator-db --org personal

# 5. Attach database to app
echo "Attaching database to app..."
flyctl postgres attach --app productformulator productformulator-db

# 6. Set environment variables
echo "Setting environment variables..."
flyctl secrets set \
  NODE_ENV=production \
  SESSION_SECRET=$(openssl rand -base64 32) \
  GMAIL_USER="your-business-email@gmail.com" \
  GMAIL_PASS="your-app-password" \
  --app productformulator

# 7. Deploy the application
echo "Deploying application..."
flyctl deploy --app productformulator

# 8. Scale and configure
echo "Configuring scaling..."
flyctl scale count 1 --app productformulator

echo "✅ Deployment complete!"
echo "🌐 Your app is available at: https://productformulator.fly.dev"
echo ""
echo "Next steps:"
echo "1. Update SHOPIFY_STARTER_URL and SHOPIFY_PROFESSIONAL_URL"
echo "2. Configure your Shopify webhooks to point to your new domain"
echo "3. Test the complete user flow"
echo ""
echo "Useful commands:"
echo "- flyctl logs --app productformulator (view logs)"
echo "- flyctl ssh console --app productformulator (access server)"
echo "- flyctl status --app productformulator (check status)"
