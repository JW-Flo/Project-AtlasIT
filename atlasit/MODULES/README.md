# AtlasIT Modules

Core platform modules and their responsibilities.

## Module Overview

- **JML Engine**: User lifecycle workflows (Joiner/Mover/Leaver)
- **Policy Engine**: Policy evaluation and enforcement
- **Evidence System**: Cryptographic audit trail
- **Adapters**: External system integrations
- **Runtime**: Shared utilities and infrastructure

## Module Structure

Each module includes:

- **README.md**: Purpose, architecture, API documentation
- **Implementation**: Core logic (in `/src` or module-specific directory)
- **Tests**: Unit and integration tests
- **Migrations**: Database schema changes (if applicable)

## Module Guidelines

1. **Single Responsibility**: Each module has one clear purpose
2. **Well-Defined Interfaces**: Clear APIs between modules
3. **Independent Testing**: Modules can be tested in isolation
4. **Minimal Dependencies**: Reduce coupling between modules
5. **Documentation**: Keep README updated with changes

## Adding a New Module

1. Create module directory structure
2. Add README with purpose and API docs
3. Implement core functionality
4. Add comprehensive tests
5. Update this index
6. Add to CI/CD pipeline

## Contributing

See [Development Guide](../../docs/developer-guide.md) for module contribution guidelines.
