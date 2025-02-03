#!/bin/bash

# This script synchronizes the main branch from the origin repository to the client repository.
# It performs a force push which will overwrite any divergent changes in the client repository.
# Use with caution as this is a destructive operation.

echo "Fetching latest changes..."
git fetch origin
git fetch client

echo "Resetting client branch to match origin (force overwrite)..."
git reset --hard origin/main  # Ensures local branch exactly matches origin

echo "Force pushing to client repo..."
git push --force client main  # Overwrites the client repo

echo "Sync completed! The client repository is now up-to-date with origin."
