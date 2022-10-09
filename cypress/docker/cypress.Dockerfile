FROM cypress/included:10.9.0

WORKDIR /app

# Suppress most Cypress output
# ENV CI=1

# CMD ["cypress run"]
# CMD ["bash"]
ENTRYPOINT ["bash"]
