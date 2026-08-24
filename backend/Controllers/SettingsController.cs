using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public ActionResult<AppSettingsModel> GetSettings()
        {
            return Ok(_settingsService.GetSettings());
        }

        [HttpPost]
        public ActionResult<AppSettingsModel> SaveSettings([FromBody] AppSettingsModel newSettings)
        {
            _settingsService.SaveSettings(newSettings);
            return Ok(_settingsService.GetSettings());
        }
    }
}
