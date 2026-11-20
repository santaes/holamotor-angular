// Make Angular's JIT compiler available so services that import @angular/common/http
// (which references PlatformLocation) don't throw at module-load time in Jest.
import '@angular/compiler';
